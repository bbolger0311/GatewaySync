import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrganizationByClerkId } from "@/lib/organizations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");
  if (!hasDashboardAccess) redirect("/billing");

  const dbOrg = await getOrganizationByClerkId(orgId);
  const submissions = dbOrg
    ? await prisma.invoiceSubmission.findMany({
        where: { organizationId: dbOrg.id },
        include: { purchaseOrder: true, submittedByUser: true },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Submitted invoices</h1>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                    {s.submittedByUser?.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.submittedAt.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-xs min-w-48 whitespace-normal text-sm text-muted-foreground"
                    title={s.portalMessage ?? undefined}
                  >
                    {s.portalMessage ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
