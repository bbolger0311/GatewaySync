import { auth } from "@clerk/nextjs/server";

// Both org-scoped plans configured in the Clerk Dashboard — "org:" prefix
// is required by Clerk's has({ plan }) check. Every org is on the free
// plan by default; Standard Plan ($999/mo) is the paid upsell. Only the
// paid plan grants dashboard access — creating an org (which happens
// automatically on the free plan) must never be enough on its own,
// or the paywall is trivially bypassed by anyone who just signs up.
export const FREE_PLAN_KEY = "org:free_org";
export const STANDARD_PLAN_KEY = "org:standard_plan";

// One deliberate, narrow exception to "free plan grants nothing" above: the
// admin's own "Test Organization" (looked up by exact Clerk org ID, not
// name — names aren't unique or stable) gets dashboard access without a
// paid plan, for testing. Matched by ID, not by plan, so it stays a single
// hardcoded org rather than a rule that could accidentally widen later.
const TEST_ORG_ID = "org_3HWQWLaXjWxfinNdMPiZIXZLZqD";

export async function getSubscriptionStatus() {
  const { userId, orgId, has } = await auth();
  const hasPaidPlan = orgId ? has({ plan: STANDARD_PLAN_KEY }) : false;
  const isTestOrg = orgId === TEST_ORG_ID;
  const hasDashboardAccess = hasPaidPlan || isTestOrg;
  return { userId, orgId, hasDashboardAccess, hasPaidPlan };
}
