import type { Portal } from "@/generated/prisma/client";

export interface PortalOAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

const PORTAL_KEYS = ["COUPA", "ARIBA"] as const;

export function isPortal(value: string): value is Portal {
  return (PORTAL_KEYS as readonly string[]).includes(value);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Coupa's OAuth endpoints are per-tenant (https://<instance>.coupahost.com/...)
// and Ariba's are per-realm on SAP's API gateway, so both are supplied via
// env vars rather than hardcoded. See the API references in the requirements
// doc for how to find these for a given tenant/realm.
export function getPortalConfig(portal: Portal): PortalOAuthConfig {
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
  }
}
