# GatewaySync

A consolidated invoice submission platform: an organization links its own
procurement portal accounts (Coupa, Ariba, Procurify, Zycus, AvidXchange,
Tipalti, Ramp, Stampli) via OAuth (or an API key for Tipalti), sees every
open purchase order from all of them in one table, and submits invoices
against them without leaving the site.

## Stack

- **Next.js** (App Router, TypeScript) — server routes handle all portal API
  calls, so portal credentials never reach the browser
- **Clerk** — sign-up/sign-in, Organizations, email verification, session
  management
- **PostgreSQL + Prisma** — linked portal connections, cached POs, invoice
  submission history (`prisma/schema.prisma`)
- **Tailwind CSS + shadcn/ui** — PO table, filters, submission dialog
- **exceljs** — PO list export/import

## Getting started

1. Copy `.env.example` to `.env` and fill in:
   - A Postgres `DATABASE_URL` (`npx prisma dev` spins up a local one)
   - Clerk keys from the [Clerk dashboard](https://dashboard.clerk.com)
   - An `ENCRYPTION_KEY` — generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

   Portal credentials (Coupa/Ariba/etc client id/secret, Tipalti's API key)
   are **not** set in `.env` — see "Connecting a portal" below.

2. Apply the database schema:

   ```bash
   npx prisma migrate dev
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Connecting a portal

Each of Coupa, Ariba, Procurify, Zycus, AvidXchange, Ramp, and Stampli is a
per-tenant enterprise system — every organization using GatewaySync connects
its own instance, with its own OAuth app. There's no shared, platform-wide
client: on the Portal Links page (`/dashboard/portal-links`), each org
registers an OAuth app in its own portal instance (see that portal's admin
console, e.g. Coupa's is under Setup → Integrations → Oauth2/OpenID Connect
Clients) and enters the resulting authorize/token URLs and client id/secret
there. That gets stored encrypted per-organization
(`PortalOAuthClient`), then "Connect" starts the normal OAuth redirect.

Tipalti's Procurement API has no OAuth flow — its card just takes a
per-organization API key instead (`TIPALTI_ENVIRONMENT` in `.env` only picks
sandbox vs. production, since Tipalti's base URLs are fixed rather than
per-tenant).

## Where things live

- `prisma/schema.prisma` — `Organization`, `User`, `PortalConnection`
  (established connections/tokens), `PortalOAuthClient` (each org's own
  OAuth app credentials per portal), `PurchaseOrder`, `InvoiceSubmission`
- `src/app/api/portals/[provider]/authorize|callback` — OAuth flow for
  linking a portal account, using that org's own `PortalOAuthClient`
- `src/app/api/portals/[provider]/oauth-client` — saves an org's OAuth app
  credentials for an OAuth portal
- `src/app/api/portals/[provider]/connect` — saves an org's API key for
  Tipalti
- `src/lib/portals/config.ts` — portal type guards, org-scoped OAuth config
  lookup, Tipalti's base URL
- `src/lib/portals/registry.ts` — display metadata + auth type per portal,
  drives the Portal Links UI
- `src/lib/portals/sync.ts` — **integration points still to fill in**:
  pulling open POs from a portal's API, and submitting an invoice to one
- `src/app/dashboard` — consolidated PO table, filtering, submission dialog,
  Excel import/export, and submission history
- `src/lib/encryption.ts` — AES-256-GCM helpers used to encrypt portal
  tokens, client secrets, and API keys before they're stored

## API references

- [Coupa Core API — OAuth 2.0 and OIDC](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc/openid-connect-clients)
- [Ariba APIs](https://help.sap.com/docs/ariba-apis)
- [Procurify API](https://developer.procurify.com/)
- [Zycus technical documentation](https://www.zycus.com/knowledge-hub/technical-documentation)
- [AvidXchange developer portal](https://developer.avidxchange.com/)
- [Tipalti Procurement REST API](https://help.tipalti.com/hc/en-us/articles/30718248220823-Procurement-REST-API-documentation)
- [Ramp Developer API](https://docs.ramp.com/developer-api/v1/introduction)
- Stampli — no public API reference found; confirm endpoint paths/scopes
  directly with Stampli before connecting
