import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing";
import { getOrgOAuthConfig, isOAuthPortal } from "@/lib/portals/config";
import { getOrCreateOrganization } from "@/lib/organizations";

const STATE_COOKIE_MAX_AGE_SECONDS = 600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { userId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  if (!orgId) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (!hasDashboardAccess) {
    return NextResponse.redirect(new URL("/billing", req.url));
  }

  const { provider } = await params;
  const portalKey = provider.toUpperCase();
  if (!isOAuthPortal(portalKey)) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }

  const dbOrg = await getOrCreateOrganization(orgId);
  const config = await getOrgOAuthConfig(dbOrg.id, portalKey);
  if (!config) {
    return NextResponse.redirect(
      new URL(`/dashboard/portal-links?portal_error=${provider}_not_configured`, req.url),
    );
  }

  const state = crypto.randomBytes(24).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set(`oauth_state_${portalKey}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  const redirectUri = new URL(`/api/portals/${provider}/callback`, req.url).toString();

  const authorizeUrl = new URL(config.authorizeUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  if (config.scope) authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl);
}
