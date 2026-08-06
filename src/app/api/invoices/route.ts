import crypto from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { submitInvoiceToPortal } from "@/lib/portals/sync";

// Private, not under /public — attachments are never served statically.
// Retrieving one later needs an authenticated route that checks the
// requesting user owns the submission before streaming the file back.
const UPLOAD_DIR = path.join(process.cwd(), "storage", "invoices");

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const purchaseOrderId = formData.get("purchaseOrderId");
  const fieldsRaw = formData.get("fields");
  const attachment = formData.get("attachment");

  if (typeof purchaseOrderId !== "string" || typeof fieldsRaw !== "string") {
    return NextResponse.json({ error: "Missing purchaseOrderId or fields" }, { status: 400 });
  }

  const purchaseOrder = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, portalConnection: { userId: dbUser.id } },
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
      userId: dbUser.id,
      purchaseOrderId: purchaseOrder.id,
      portal: purchaseOrder.portal,
      submittedFields: JSON.parse(fieldsRaw),
      attachmentUrl: attachmentPath,
      status: "PENDING",
    },
  });

  const result = await submitInvoiceToPortal();

  const updated = await prisma.invoiceSubmission.update({
    where: { id: submission.id },
    data: {
      status: result.ok ? "CONFIRMED" : "FAILED",
      portalResponse: result.response,
    },
  });

  return NextResponse.json({ status: updated.status });
}
