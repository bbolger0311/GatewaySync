import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPortalConfig, isPortal } from "@/lib/portals/config";
import { encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const { provider } = await params;
  const portalKey = provider.toUpperCase();
  if (!isPortal(portalKey)) {
    return NextResponse.json({ error: "Unknown portal" }, { status: 404 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const stateCookieName = `oauth_state_${portalKey}`;
  const expectedState = cookieStore.get(stateCookieName)?.value;
  cookieStore.delete(stateCookieName);

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/dashboard?portal_error=${encodeURIComponent(oauthError)}`, req.url),
    );
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/dashboard?portal_error=invalid_state", req.url));
  }

  const config = getPortalConfig(portalKey);
  const redirectUri = new URL(`/api/portals/${provider}/callback`, req.url).toString();

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard?portal_error=token_exchange_failed", req.url),
    );
  }

  const tokens = (await tokenRes.json()) as TokenResponse;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.redirect(new URL("/dashboard?portal_error=missing_email", req.url));
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });

  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await prisma.portalConnection.upsert({
    where: { userId_portal: { userId: dbUser.id, portal: portalKey } },
    update: {
      accessTokenCipher: encrypt(tokens.access_token),
      refreshTokenCipher: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt,
      scope: tokens.scope ?? null,
    },
    create: {
      userId: dbUser.id,
      portal: portalKey,
      accessTokenCipher: encrypt(tokens.access_token),
      refreshTokenCipher: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt,
      scope: tokens.scope ?? null,
    },
  });

  return NextResponse.redirect(new URL(`/dashboard?connected=${provider}`, req.url));
}
