import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing";
import { isOAuthPortal } from "@/lib/portals/config";
import { encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { getOrCreateOrganization } from "@/lib/organizations";

// Saves an organization's own OAuth app credentials for a given OAuth
// portal — its buyer-instance authorize/token URLs, client id, and client
// secret, registered by that org in their own portal tenant. Required
// before /api/portals/[provider]/authorize can do anything, since there's
// no platform-wide OAuth client (see lib/portals/config.ts).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { userId: clerkId, orgId, hasDashboardAccess } = await getSubscriptionStatus();
  if (!clerkId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ error: "No organization selected." }, { status: 400 });
  }
  if (!hasDashboardAccess) {
    return NextResponse.json({ error: "Your organization needs dashboard access." }, { status: 403 });
  }

  const { provider } = await params;
  const portalKey = provider.toUpperCase();
  if (!isOAuthPortal(portalKey)) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    authorizeUrl?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
  } | null;

  const authorizeUrl = body?.authorizeUrl?.trim();
  const tokenUrl = body?.tokenUrl?.trim();
  const clientId = body?.clientId?.trim();
  const clientSecret = body?.clientSecret?.trim();
  const scope = body?.scope?.trim() || null;

  if (!authorizeUrl || !tokenUrl || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Authorize URL, token URL, client ID, and client secret are all required." },
      { status: 400 },
    );
  }
  try {
    new URL(authorizeUrl);
    new URL(tokenUrl);
  } catch {
    return NextResponse.json(
      { error: "Authorize URL and token URL must be valid URLs." },
      { status: 400 },
    );
  }

  const dbOrg = await getOrCreateOrganization(orgId);

  await prisma.portalOAuthClient.upsert({
    where: { organizationId_portal: { organizationId: dbOrg.id, portal: portalKey } },
    update: {
      authorizeUrl,
      tokenUrl,
      clientId,
      clientSecretCipher: encrypt(clientSecret),
      scope,
    },
    create: {
      organizationId: dbOrg.id,
      portal: portalKey,
      authorizeUrl,
      tokenUrl,
      clientId,
      clientSecretCipher: encrypt(clientSecret),
      scope,
    },
  });

  return NextResponse.json({ ok: true });
}
