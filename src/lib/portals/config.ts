export interface PortalOAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Coupa's OAuth endpoints are per-tenant (https://<instance>.coupahost.com/...),
// Ariba's are per-realm on SAP's API gateway, and Procurify's/Zycus's/
// AvidXchange's/Stampli's are per-company instance, so those are supplied
// via env vars rather than hardcoded. See the API references in the
// requirements doc for how to find these for a given tenant/realm/instance.
// Ramp is the exception — https://docs.ramp.com/developer-api/v1/guides/oauth
// documents fixed, global authorize/token URLs (same for every customer),
// so those have real defaults below, picked by RAMP_ENVIRONMENT.
const RAMP_URLS = {
  production: {
    authorizeUrl: "https://app.ramp.com/v1/authorize",
    tokenUrl: "https://api.ramp.com/developer/v1/token",
  },
  sandbox: {
    authorizeUrl: "https://demo.ramp.com/v1/authorize",
    tokenUrl: "https://demo-api.ramp.com/developer/v1/token",
  },
} as const;

export function getPortalConfig(portal: OAuthPortal): PortalOAuthConfig {
  switch (portal) {
    case "COUPA":
      return {
        authorizeUrl: requireEnv("COUPA_AUTHORIZE_URL"),
        tokenUrl: requireEnv("COUPA_TOKEN_URL"),
        clientId: requireEnv("COUPA_CLIENT_ID"),
        clientSecret: requireEnv("COUPA_CLIENT_SECRET"),
        scope: process.env.COUPA_SCOPE ?? "core.purchase_order.read core.invoice.write",
      };
    case "ARIBA":
      return {
        authorizeUrl: requireEnv("ARIBA_AUTHORIZE_URL"),
        tokenUrl: requireEnv("ARIBA_TOKEN_URL"),
        clientId: requireEnv("ARIBA_CLIENT_ID"),
        clientSecret: requireEnv("ARIBA_CLIENT_SECRET"),
        scope: process.env.ARIBA_SCOPE ?? "read write",
      };
    case "PROCURIFY":
      return {
        authorizeUrl: requireEnv("PROCURIFY_AUTHORIZE_URL"),
        tokenUrl: requireEnv("PROCURIFY_TOKEN_URL"),
        clientId: requireEnv("PROCURIFY_CLIENT_ID"),
        clientSecret: requireEnv("PROCURIFY_CLIENT_SECRET"),
        scope: process.env.PROCURIFY_SCOPE ?? "purchase_orders:read invoices:write",
      };
    case "ZYCUS":
      return {
        authorizeUrl: requireEnv("ZYCUS_AUTHORIZE_URL"),
        tokenUrl: requireEnv("ZYCUS_TOKEN_URL"),
        clientId: requireEnv("ZYCUS_CLIENT_ID"),
        clientSecret: requireEnv("ZYCUS_CLIENT_SECRET"),
        scope: process.env.ZYCUS_SCOPE ?? "purchase_orders:read invoices:write",
      };
    case "AVIDXCHANGE":
      return {
        authorizeUrl: requireEnv("AVIDXCHANGE_AUTHORIZE_URL"),
        tokenUrl: requireEnv("AVIDXCHANGE_TOKEN_URL"),
        clientId: requireEnv("AVIDXCHANGE_CLIENT_ID"),
        clientSecret: requireEnv("AVIDXCHANGE_CLIENT_SECRET"),
        scope: process.env.AVIDXCHANGE_SCOPE ?? "purchase_orders:read invoices:write",
      };
    case "RAMP": {
      const env = process.env.RAMP_ENVIRONMENT ?? "production";
      if (env !== "production" && env !== "sandbox") {
        throw new Error(
          `Invalid RAMP_ENVIRONMENT: "${env}" (expected "sandbox" or "production")`,
        );
      }
      return {
        authorizeUrl: process.env.RAMP_AUTHORIZE_URL ?? RAMP_URLS[env].authorizeUrl,
        tokenUrl: process.env.RAMP_TOKEN_URL ?? RAMP_URLS[env].tokenUrl,
        clientId: requireEnv("RAMP_CLIENT_ID"),
        clientSecret: requireEnv("RAMP_CLIENT_SECRET"),
        scope: process.env.RAMP_SCOPE ?? "bills:read bills:write",
      };
    }
    case "STAMPLI":
      return {
        authorizeUrl: requireEnv("STAMPLI_AUTHORIZE_URL"),
        tokenUrl: requireEnv("STAMPLI_TOKEN_URL"),
        clientId: requireEnv("STAMPLI_CLIENT_ID"),
        clientSecret: requireEnv("STAMPLI_CLIENT_SECRET"),
        scope: process.env.STAMPLI_SCOPE ?? "purchase_orders:read invoices:write",
      };
  }
}

// Tipalti's Procurement API has two fixed base URLs (not per-tenant) — which
// one to call is an environment choice for the whole app, set once via env
// var, same as the OAuth portals' per-tenant URLs above. The org's API key
// (entered per-connection, see /api/portals/tipalti/connect) is what scopes
// requests to their account.
export function getTipaltiBaseUrl(): string {
  const env = process.env.TIPALTI_ENVIRONMENT ?? "sandbox";
  if (env === "production") return "https://triggers.approve.com";
  if (env === "sandbox") return "https://triggers.sandbox.approve.com";
  throw new Error(`Invalid TIPALTI_ENVIRONMENT: "${env}" (expected "sandbox" or "production")`);
}
