import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrganizationByClerkId } from "@/lib/organizations";
import { PortalConnections } from "@/components/dashboard/portal-connections";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

function portalErrorMessage(code: string): string {
  if (code.endsWith("_not_configured")) {
    const portal = code.replace("_not_configured", "");
    return `${portal[0].toUpperCase()}${portal.slice(1)} isn't set up yet — add its OAuth client id/secret to .env before connecting.`;
  }
  if (code === "invalid_state") {
    return "That connection attempt expired or was tampered with — try connecting again.";
  }
  if (code === "token_exchange_failed") {
    return "The portal rejected the connection request. Double-check the OAuth client credentials.";
  }
  if (code === "missing_email") {
    return "Your account needs a verified email before linking a portal.";
  }
  return `Connection failed: ${code}`;
}

export default async function PortalLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; portal_error?: string }>;
}) {
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");
  if (!hasDashboardAccess) redirect("/billing");

  const { connected, portal_error: portalError } = await searchParams;

  const dbOrg = await getOrganizationByClerkId(orgId);
  const portalConnections = dbOrg
    ? await prisma.portalConnection.findMany({ where: { organizationId: dbOrg.id } })
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Portal Links</h1>
            <p className="text-sm text-muted-foreground">
              Connect the procurement portals your organization uses &mdash; every
              linked portal is shared with your whole team.
            </p>
          </div>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </div>

        {connected && (
          <p className="rounded-md border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground">
            Connected to {connected}.
          </p>
        )}
        {portalError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {portalErrorMessage(portalError)}
          </p>
        )}

        <PortalConnections connections={portalConnections} />
      </div>
      <SiteFooter />
    </div>
  );
}
