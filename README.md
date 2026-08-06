# GatewaySync

A consolidated invoice submission platform: users link their Coupa and Ariba
accounts via OAuth, see every open purchase order from both in one table,
and submit invoices against them without leaving the site.

## Stack

- **Next.js** (App Router, TypeScript) — server routes handle all Coupa/Ariba
  API calls, so portal credentials never reach the browser
- **Clerk** — sign-up/sign-in, email verification, session management
- **PostgreSQL + Prisma** — linked portal connections, cached POs, invoice
  submission history (`prisma/schema.prisma`)
- **Tailwind CSS + shadcn/ui** — PO table, filters, submission dialog
- **exceljs** — PO list export to `.xlsx`

## Getting started

1. Copy `.env.example` to `.env` and fill in:
   - A Postgres `DATABASE_URL` (`npx prisma dev` spins up a local one)
   - Clerk keys from the [Clerk dashboard](https://dashboard.clerk.com)
   - An `ENCRYPTION_KEY` — generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Coupa/Ariba OAuth client id/secret and endpoint URLs for your tenant/realm
     (see the API references below)

2. Apply the database schema:

   ```bash
   npx prisma migrate dev
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Where things live

- `prisma/schema.prisma` — `User`, `PortalConnection`, `PurchaseOrder`,
  `InvoiceSubmission` models
- `src/app/api/portals/[provider]/authorize|callback` — OAuth flow for
  linking a Coupa/Ariba account to the signed-in user
- `src/lib/portals/config.ts` — per-portal OAuth endpoint/client config
- `src/lib/portals/sync.ts` — **integration points still to fill in**:
  pulling open POs from a portal's API, and submitting an invoice to one
- `src/app/dashboard` — consolidated PO table, filtering, submission dialog,
  Excel export, and submission history
- `src/lib/encryption.ts` — AES-256-GCM helpers used to encrypt portal
  tokens before they're stored

## API references

- [Coupa Core API overview](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/coupa-core-api-overview)
- [Ariba APIs](https://help.sap.com/docs/ariba-apis)
