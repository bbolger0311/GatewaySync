import { CreateOrganization } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (orgId) redirect("/billing");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create your organization</h1>
          <p className="text-sm text-muted-foreground">
            GatewaySync accounts are organization-based &mdash; create one to subscribe
            and start connecting Coupa and Ariba.
          </p>
        </div>
        <CreateOrganization afterCreateOrganizationUrl="/billing" skipInvitationScreen />
      </div>
      <SiteFooter />
    </div>
  );
}
