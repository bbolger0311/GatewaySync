import { PricingTable } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSubscriptionStatus } from "@/lib/billing";

export default async function BillingPage() {
  const { userId, orgId, hasPaidPlan } = await getSubscriptionStatus();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");
  if (hasPaidPlan) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Upgrade GatewaySync</h1>
          <p className="text-sm text-muted-foreground">
            Your organization already has dashboard access on the free plan &mdash;
            upgrade to Standard for the full feature set.
          </p>
        </div>
        <div className="w-full">
          <PricingTable for="organization" newSubscriptionRedirectUrl="/dashboard" />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
