import { auth } from "@clerk/nextjs/server";

// Both org-scoped plans configured in the Clerk Dashboard — "org:" prefix
// is required by Clerk's has({ plan }) check. Every org is on the free
// plan by default; Standard Plan ($999/mo) is the paid upsell. Both grant
// full dashboard access — the paywall is opt-in revenue, not a feature gate.
export const FREE_PLAN_KEY = "org:free_org";
export const STANDARD_PLAN_KEY = "org:standard_plan";

export async function getSubscriptionStatus() {
  const { userId, orgId, has } = await auth();
  const hasPaidPlan = orgId ? has({ plan: STANDARD_PLAN_KEY }) : false;
  const hasDashboardAccess = orgId ? hasPaidPlan || has({ plan: FREE_PLAN_KEY }) : false;
  return { userId, orgId, hasDashboardAccess, hasPaidPlan };
}
