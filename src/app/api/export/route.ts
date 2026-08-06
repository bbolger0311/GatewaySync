import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  const purchaseOrders = dbUser
    ? await prisma.purchaseOrder.findMany({
        where: { portalConnection: { userId: dbUser.id } },
        orderBy: { lastSyncedAt: "desc" },
      })
    : [];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Purchase Orders");
  sheet.columns = [
    { header: "PO Number", key: "poNumber", width: 20 },
    { header: "Source Portal", key: "portal", width: 14 },
    { header: "Vendor", key: "vendor", width: 28 },
    { header: "Last Synced", key: "lastSynced", width: 22 },
  ];
  for (const po of purchaseOrders) {
    sheet.addRow({
      poNumber: po.externalPoNumber,
      portal: po.portal,
      vendor: po.vendorName ?? "",
      lastSynced: po.lastSyncedAt.toISOString(),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="purchase-orders.xlsx"',
    },
  });
}
