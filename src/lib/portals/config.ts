import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export interface PortalOAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string | null;
}

// Portals that authenticate via OAuth2 authorization-code flow, through
// /api/portals/[provider]/authorize and /callback.
const OAUTH_PORTAL_KEYS = [
  "COUPA",
  "ARIBA",
  "PROCURIFY",
  "ZYCUS",
  "AVIDXCHANGE",
  "RAMP",
  "STAMPLI",
] as const;
export type OAuthPortal = (typeof OAUTH_PORTAL_KEYS)[number];

export function isOAuthPortal(value: string): value is OAuthPortal {
  return (OAUTH_PORTAL_KEYS as readonly string[]).includes(value);
}

// Portals that authenticate via a static API key pasted in by the org admin,
// through /api/portals/[provider]/connect — Tipalti's Procurement API has
// no OAuth flow, only an x-api-key header issued by a Tipalti implementation
// manager. See: https://help.tipalti.com/hc/en-us/articles/30718248220823
const API_KEY_PORTAL_KEYS = ["TIPALTI"] as const;
export type ApiKeyPortal = (typeof API_KEY_PORTAL_KEYS)[number];

export function isApiKeyPortal(value: string): value is ApiKeyPortal {
  return (API_KEY_PORTAL_KEYS as readonly string[]).includes(value);
}

// OAuth portals are per-tenant (Coupa: https://<instance>.coupahost.com/...;
// Ariba: per-realm on SAP's API gateway; Procurify/Zycus/AvidXchange/Stampli:
// per-company instance; Ramp: global URLs, but still a per-company client
// registration) — two different GatewaySync organizations connecting
// "Coupa" are very likely talking to two entirely different Coupa tenants,
// each with its own OAuth app. So there's no platform-wide client id/secret:
// every organization registers its own OAuth app with its own portal
// instance and enters the resulting credentials via the Portal Links page
// (see /api/portals/[provider]/oauth-client), stored encrypted in the new
// PortalOAuthClient table. This just looks that row up.
export async function getOrgOAuthConfig(
  organizationId: string,
  portal: OAuthPortal,
): Promise<PortalOAuthConfig | null> {
  const client = await prisma.portalOAuthClient.findUnique({
    where: { organizationId_portal: { organizationId, portal } },
  });
  if (!client) return null;
  return {
    authorizeUrl: client.authorizeUrl,
    tokenUrl: client.tokenUrl,
    clientId: client.clientId,
    clientSecret: decrypt(client.clientSecretCipher),
    scope: client.scope,
  };
}

// Purely a UI hint (placeholder text on the credentials form) — never used
// as a silent default, since these vary per tenant/instance and getting one
// wrong just means a failed connection rather than a security issue. Ramp's
// are the one case that's genuinely the same for every customer.
export const OAUTH_FIELD_HINTS: Record<
  OAuthPortal,
  { authorizeUrl: string; tokenUrl: string; scope: string }
> = {
  COUPA: {
    authorizeUrl: "https://<your-instance>.coupahost.com/oauth2/authorizations/new",
    tokenUrl: "https://<your-instance>.coupahost.com/oauth2/token",
    scope: "core.purchase_order.read core.invoice.write",
  },
  ARIBA: {
    authorizeUrl: "https://<realm>.ariba.com/...",
    tokenUrl: "https://<realm>.ariba.com/...",
    scope: "read write",
  },
  PROCURIFY: {
    authorizeUrl: "https://<your-company>.procurify.com/oauth/authorize",
    tokenUrl: "https://<your-company>.procurify.com/oauth/token",
    scope: "purchase_orders:read invoices:write",
  },
  ZYCUS: {
    authorizeUrl: "https://<your-company>.zycus.com/oauth/authorize",
    tokenUrl: "https://<your-company>.zycus.com/oauth/token",
    scope: "purchase_orders:read invoices:write",
  },
  AVIDXCHANGE: {
    authorizeUrl: "https://<your-company>.avidxchange.com/oauth/authorize",
    tokenUrl: "https://<your-company>.avidxchange.com/oauth/token",
    scope: "purchase_orders:read invoices:write",
  },
  RAMP: {
    authorizeUrl: "https://app.ramp.com/v1/authorize",
    tokenUrl: "https://api.ramp.com/developer/v1/token",
    scope: "bills:read bills:write",
  },
  STAMPLI: {
    authorizeUrl: "https://<your-company>.stampli.com/oauth/authorize",
    tokenUrl: "https://<your-company>.stampli.com/oauth/token",
    scope: "purchase_orders:read invoices:write",
  },
};

// Tipalti's Procurement API has two fixed base URLs (not per-tenant) — which
// one to call is an environment choice for the whole app, set once via env
// var. The org's API key (entered per-connection, see
// /api/portals/tipalti/connect) is what scopes requests to their account.
export function getTipaltiBaseUrl(): string {
  const env = process.env.TIPALTI_ENVIRONMENT ?? "sandbox";
  if (env === "production") return "https://triggers.approve.com";
  if (env === "sandbox") return "https://triggers.sandbox.approve.com";
  throw new Error(`Invalid TIPALTI_ENVIRONMENT: "${env}" (expected "sandbox" or "production")`);
}
