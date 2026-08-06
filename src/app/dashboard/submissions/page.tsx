import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT = {
  CONFIRMED: "default",
  FAILED: "destructive",
  PENDING: "secondary",
} as const;

export default async function SubmissionsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  const submissions = dbUser
    ? await prisma.invoiceSubmission.findMany({
        where: { userId: dbUser.id },
        include: { purchaseOrder: true },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Submitted invoices</h1>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No invoices submitted yet.
                </TableCell>
              </TableRow>
            )}
            {submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">
                  {s.purchaseOrder.externalPoNumber}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{s.portal}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.submittedAt.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
