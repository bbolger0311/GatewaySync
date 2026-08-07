import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrganizationByClerkId } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { submitInvoiceToPortal } from "@/lib/portals/sync";

type RequiredField = { label: string; type?: string };

interface RowResult {
  row: number;
  poNumber: string;
  status: "confirmed" | "failed" | "skipped";
  reason?: string;
}

export async function POST(req: NextRequest) {
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId || !hasDashboardAccess) {
    return NextResponse.json(
      { error: "You need to create or join an organization to import invoices." },
      { status: 402 },
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  const dbOrg = await getOrganizationByClerkId(orgId);
  if (!dbUser || !dbOrg) {
    return NextResponse.json({ error: "No purchase orders found for your organization" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs ships its own global `Buffer extends ArrayBuffer` type shim,
    // which merges with @types/node's Buffer into a shape no real Buffer
    // instance satisfies under our lib target — the value is fine at runtime.
    // @ts-expect-error — see comment above; exceljs's own types are unsatisfiable here.
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Couldn't read that file as an .xlsx workbook" }, { status: 400 });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return NextResponse.json({ error: "No worksheet found in file" }, { status: 400 });
  }

  const headers: string[] = [];
  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const poNumberCol = headers.indexOf("PO Number");
  if (poNumberCol === -1) {
    return NextResponse.json(
      { error: 'Missing a "PO Number" column — use the provided template.' },
      { status: 400 },
    );
  }

  const results: RowResult[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const poNumber = String(row.getCell(poNumberCol).value ?? "").trim();
    if (!poNumber) continue;

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        externalPoNumber: poNumber,
        portalConnection: { organizationId: dbOrg.id },
      },
    });

    if (!purchaseOrder) {
      results.push({ row: r, poNumber, status: "skipped", reason: "PO not found" });
      continue;
    }

    const requiredFields = (purchaseOrder.requiredFields as Record<string, RequiredField>) ?? {};
    const submittedFields: Record<string, string> = {};
    let missingField: string | null = null;

    for (const [key, field] of Object.entries(requiredFields)) {
      const col = headers.indexOf(field.label);
      const value = col === -1 ? "" : String(row.getCell(col).value ?? "").trim();
      if (!value) {
        missingField = field.label;
        break;
      }
      submittedFields[key] = value;
    }

    if (missingField) {
      results.push({
        row: r,
        poNumber,
        status: "skipped",
        reason: `Missing value for "${missingField}"`,
      });
      continue;
    }

    // Each row's submission is isolated — an unexpected error here (e.g. a
    // real portal API timing out, once sync.ts's stub is replaced with a
    // live call) must only fail this one row, never abort the batch or the
    // whole request.
    let submissionId: string | null = null;
    try {
      const submission = await prisma.invoiceSubmission.create({
        data: {
          organizationId: dbOrg.id,
          submittedByUserId: dbUser.id,
          purchaseOrderId: purchaseOrder.id,
          portal: purchaseOrder.portal,
          submittedFields,
          status: "PENDING",
        },
      });
      submissionId = submission.id;

      const result = await submitInvoiceToPortal(purchaseOrder.portal);

      await prisma.invoiceSubmission.update({
        where: { id: submission.id },
        data: {
          status: result.ok ? "CONFIRMED" : "FAILED",
          portalMessage: result.message,
          portalResponse: result.response,
        },
      });

      results.push({
        row: r,
        poNumber,
        status: result.ok ? "confirmed" : "failed",
        reason: result.message,
      });
    } catch (err) {
      const reason = "Unexpected error submitting this PO — it was left open to retry.";
      if (submissionId) {
        await prisma.invoiceSubmission
          .update({
            where: { id: submissionId },
            data: { status: "FAILED", portalMessage: reason, portalResponse: { error: String(err) } },
          })
          .catch(() => {});
      }
      results.push({ row: r, poNumber, status: "failed", reason });
    }
  }

  return NextResponse.json({ results });
}
