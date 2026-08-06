import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PortalConnections } from "@/components/dashboard/portal-connections";
import { PurchaseOrderTable } from "@/components/dashboard/po-table";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; portal_error?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { connected, portal_error: portalError } = await searchParams;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    include: { portalConnections: true },
  });

  const purchaseOrders = dbUser
    ? await prisma.purchaseOrder.findMany({
        where: { portalConnection: { userId: dbUser.id } },
        orderBy: { lastSyncedAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Button variant="outline" render={<Link href="/dashboard/submissions" />}>
          Submitted invoices
        </Button>
      </div>

      {connected && (
        <p className="rounded-md border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          Connected to {connected}.
        </p>
      )}
      {portalError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Connection failed: {portalError}
        </p>
      )}

      <PortalConnections connections={dbUser?.portalConnections ?? []} />

      <PurchaseOrderTable purchaseOrders={purchaseOrders} />
    </div>
  );
}
