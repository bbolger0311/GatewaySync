import { auth } from "@clerk/nextjs/server";

// Both org-scoped plans configured in the Clerk Dashboard — "org:" prefix
// is required by Clerk's has({ plan }) check. Every org is on the free
// plan by default; Standard Plan ($999/mo) is the paid upsell. Only the
// paid plan grants dashboard access — creating an org (which happens
// automatically on the free plan) must never be enough on its own,
// or the paywall is trivially bypassed by anyone who just signs up.
export const FREE_PLAN_KEY = "org:free_org";
export const STANDARD_PLAN_KEY = "org:standard_plan";

export async function getSubscriptionStatus() {
  const { userId, orgId, has } = await auth();
  const hasPaidPlan = orgId ? has({ plan: STANDARD_PLAN_KEY }) : false;
  const hasDashboardAccess = hasPaidPlan;
  return { userId, orgId, hasDashboardAccess, hasPaidPlan };
}
