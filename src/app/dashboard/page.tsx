import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrganizationByClerkId } from "@/lib/organizations";
import { PurchaseOrderTable } from "@/components/dashboard/po-table";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function DashboardPage() {
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");
  if (!hasDashboardAccess) redirect("/billing");

  const dbOrg = await getOrganizationByClerkId(orgId);
  const purchaseOrders = dbOrg
    ? await prisma.purchaseOrder.findMany({
        where: { portalConnection: { organizationId: dbOrg.id } },
        orderBy: { lastSyncedAt: "desc" },
        include: {
          invoiceSubmissions: {
            orderBy: { submittedAt: "desc" },
            take: 1,
            select: { status: true, portalMessage: true },
          },
        },
      })
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/portal-links" />}
            >
              Portal links
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/submissions" />}
            >
              Submitted invoices
            </Button>
          </div>
        </div>

        <PurchaseOrderTable purchaseOrders={purchaseOrders} />
      </div>
      <SiteFooter />
    </div>
  );
}
