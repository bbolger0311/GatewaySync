import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/billing";
import { isApiKeyPortal } from "@/lib/portals/config";
import { encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { getOrCreateOrganization } from "@/lib/organizations";

// Connects an API-key portal (Tipalti) — the org admin pastes their API key
// here instead of going through an OAuth redirect. Counterpart to
// /api/portals/[provider]/authorize + /callback, which only handle OAuth
// portals.
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
  if (!isApiKeyPortal(portalKey)) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { apiKey?: string } | null;
  const apiKey = body?.apiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "API key is required." }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json(
      { error: "Your account needs a verified email before linking a portal." },
      { status: 400 },
    );
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });

  const dbOrg = await getOrCreateOrganization(orgId);

  await prisma.portalConnection.upsert({
    where: { organizationId_portal: { organizationId: dbOrg.id, portal: portalKey } },
    update: {
      connectedByUserId: dbUser.id,
      accessTokenCipher: encrypt(apiKey),
      refreshTokenCipher: null,
      tokenExpiresAt: null,
      scope: null,
    },
    create: {
      organizationId: dbOrg.id,
      connectedByUserId: dbUser.id,
      portal: portalKey,
      accessTokenCipher: encrypt(apiKey),
    },
  });

  return NextResponse.json({ ok: true });
}
