import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrganizationByClerkId } from "@/lib/organizations";
import { prisma } from "@/lib/prisma";

type RequiredField = { label: string; type?: string };

export async function GET(req: NextRequest) {
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  if (!orgId) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (!hasDashboardAccess) {
    return NextResponse.redirect(new URL("/billing", req.url));
  }

  const dbOrg = await getOrganizationByClerkId(orgId);
  const purchaseOrders = dbOrg
    ? await prisma.purchaseOrder.findMany({
        where: { portalConnection: { organizationId: dbOrg.id } },
        orderBy: { externalPoNumber: "asc" },
      })
    : [];

  // Union of distinct required-field labels across every open PO, in first-seen
  // order — a field unique to one portal still gets its own column, just marked
  // N/A on rows from the other portal.
  const fieldLabels: string[] = [];
  for (const po of purchaseOrders) {
    const fields = (po.requiredFields as Record<string, RequiredField>) ?? {};
    for (const { label } of Object.values(fields)) {
      if (!fieldLabels.includes(label)) fieldLabels.push(label);
    }
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Invoices");
  sheet.columns = [
    { header: "PO Number", key: "poNumber", width: 20 },
    { header: "Source Portal", key: "portal", width: 14 },
    { header: "Vendor", key: "vendor", width: 26 },
    ...fieldLabels.map((label) => ({ header: label, key: label, width: 22 })),
  ];
  sheet.getRow(1).font = { bold: true };

  for (const po of purchaseOrders) {
    const fields = (po.requiredFields as Record<string, RequiredField>) ?? {};
    const applicableLabels = new Set(Object.values(fields).map((f) => f.label));

    const row: Record<string, string> = {
      poNumber: po.externalPoNumber,
      portal: po.portal,
      vendor: po.vendorName ?? "",
    };
    for (const label of fieldLabels) {
      row[label] = applicableLabels.has(label) ? "" : "N/A";
    }
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="invoice-import-template.xlsx"',
    },
  });
}
