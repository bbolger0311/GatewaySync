import type { Portal } from "@/generated/prisma/client";

// Display metadata for the Portal Links page. To add a new OAuth integration
// once it's actually implemented: add a Portal enum value in schema.prisma,
// wire its OAuth config in lib/portals/config.ts, then add an entry here
// with available: true and authType: "oauth". Entries with available: false
// render as a "coming soon" placeholder — no config required for those.
//
// A portal whose API has no OAuth flow (e.g. Tipalti, which only issues a
// static API key) uses authType: "api_key" instead — the connect card
// renders a form that POSTs to /api/portals/[key]/connect rather than
// linking to the OAuth authorize route.
export interface PortalDefinition {
  key: string; // used in /api/portals/[key]/authorize|callback or /connect
  portal: Portal | null; // null for not-yet-implemented placeholders
  label: string;
  description: string;
  available: boolean;
  authType: "oauth" | "api_key";
}

export const PORTAL_REGISTRY: PortalDefinition[] = [
  {
    key: "coupa",
    portal: "COUPA",
    label: "Coupa",
    description: "Sync open purchase orders and submit invoices directly to Coupa.",
    available: true,
    authType: "oauth",
  },
  {
    key: "ariba",
    portal: "ARIBA",
    label: "Ariba",
    description: "Sync open purchase orders and submit invoices directly to SAP Ariba.",
    available: true,
    authType: "oauth",
  },
  {
    key: "procurify",
    portal: "PROCURIFY",
    label: "Procurify",
    description: "Sync open purchase orders and submit invoices directly to Procurify.",
    available: true,
    authType: "oauth",
  },
  {
    key: "zycus",
    portal: "ZYCUS",
    label: "Zycus",
    description: "Sync open purchase orders and submit invoices directly to Zycus.",
    available: true,
    authType: "oauth",
  },
  {
    key: "avidxchange",
    portal: "AVIDXCHANGE",
    label: "AvidXchange",
    description: "Sync open purchase orders and submit invoices directly to AvidXchange.",
    available: true,
    authType: "oauth",
  },
  {
    key: "tipalti",
    portal: "TIPALTI",
    label: "Tipalti",
    description:
      "Sync open purchase orders and submit invoices directly to Tipalti using an API key from your Implementation Manager.",
    available: true,
    authType: "api_key",
  },
  {
    key: "ramp",
    portal: "RAMP",
    label: "Ramp",
    description: "Sync open purchase orders and submit bills directly to Ramp.",
    available: true,
    authType: "oauth",
  },
  {
    key: "stampli",
    portal: "STAMPLI",
    label: "Stampli",
    description: "Sync open purchase orders and submit invoices directly to Stampli.",
    available: true,
    authType: "oauth",
  },
];
