import crypto from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrganizationByClerkId } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { submitInvoiceToPortal } from "@/lib/portals/sync";

// Private, not under /public — attachments are never served statically.
// Retrieving one later needs an authenticated route that checks the
// requesting user owns the submission before streaming the file back.
const UPLOAD_DIR = path.join(process.cwd(), "storage", "invoices");

export async function POST(req: NextRequest) {
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId || !hasDashboardAccess) {
    return NextResponse.json(
      { error: "You need to create or join an organization to submit invoices." },
      { status: 402 },
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  const dbOrg = await getOrganizationByClerkId(orgId);
  if (!dbUser || !dbOrg) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const purchaseOrderId = formData.get("purchaseOrderId");
  const fieldsRaw = formData.get("fields");
  const attachment = formData.get("attachment");

  if (typeof purchaseOrderId !== "string" || typeof fieldsRaw !== "string") {
    return NextResponse.json({ error: "Missing purchaseOrderId or fields" }, { status: 400 });
  }

  const purchaseOrder = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, portalConnection: { organizationId: dbOrg.id } },
  });
  if (!purchaseOrder) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  let attachmentPath: string | null = null;
  if (attachment instanceof File && attachment.size > 0) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${crypto.randomUUID()}.pdf`;
    const bytes = Buffer.from(await attachment.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
    attachmentPath = filename;
  }

  const submission = await prisma.invoiceSubmission.create({
    data: {
      organizationId: dbOrg.id,
      submittedByUserId: dbUser.id,
      purchaseOrderId: purchaseOrder.id,
      portal: purchaseOrder.portal,
      submittedFields: JSON.parse(fieldsRaw),
      attachmentUrl: attachmentPath,
      status: "PENDING",
    },
  });

  const result = await submitInvoiceToPortal(purchaseOrder.portal);

  const updated = await prisma.invoiceSubmission.update({
    where: { id: submission.id },
    data: {
      status: result.ok ? "CONFIRMED" : "FAILED",
      portalMessage: result.message,
      portalResponse: result.response,
    },
  });

  return NextResponse.json({ status: updated.status, message: updated.portalMessage });
}
