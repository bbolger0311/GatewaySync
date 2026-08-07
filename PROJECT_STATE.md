# GatewaySync — Project State

*Last updated: 2026-08-06. This document is a handoff/context snapshot — read it first in any new session before making changes.*

## What this is

GatewaySync ("Many Portals, One Gateway") is a consolidated invoice submission platform. An organization connects its own procurement portal accounts once, and GatewaySync pulls every open purchase order from all of them into a single table — so a team submits invoices from one place instead of logging into each portal separately.

Live in production at **Gateway-Sync.com** (Vercel + Vercel Postgres). Eight portals are wired in: **Coupa, Ariba, Procurify, Zycus, AvidXchange, Ramp, Stampli** (OAuth) and **Tipalti** (API key — see Philosophy #1 below for why it's the exception).

Originally scaffolded as "Portal Bridge," renamed to "PortalSync," then to its current name "GatewaySync" as the product positioning shifted from "we support Coupa and Ariba" to "we support many portals."

## Philosophy — the decisions that shape the codebase

These aren't obvious from the code alone; they're product decisions made over the course of building this, and future work should stay consistent with them unless the user says otherwise.

1. **OAuth by default, API key only when there's truly no alternative.** Linking a portal redirects the browser to that portal's own hosted login — GatewaySync's server only ever receives a one-time authorization code and exchanges it server-side for a token, encrypted at rest (AES-256-GCM). A customer's portal password never touches this app. This was an explicit, non-negotiable requirement. **Tipalti is the one exception**: its Procurement API has no OAuth flow at all, only a static API key issued by a Tipalti Implementation Manager (confirmed from Tipalti's own docs) — so it uses a separate "paste your API key" connect path instead. Every other portal must go through OAuth; don't add another API-key shortcut without confirming the portal genuinely has no OAuth option first.

2. **Every organization connects its own portal tenant — there is no platform-wide OAuth client.** This was a real architecture correction: the original build assumed one global `client_id`/`client_secret` per portal type (set via env vars), which only works if every GatewaySync customer submits into the *same* buyer's instance. The confirmed real use case is the opposite — **many different buyers**, each running its own separate Coupa/Ariba/etc. instance, e.g. 500 organizations could mean 500 distinct Coupa tenants. So OAuth app credentials (authorize/token URLs, client id, client secret) are entered **per-organization** on the Portal Links page and stored encrypted in `PortalOAuthClient`, not read from env vars. `lib/portals/config.ts`'s `getOrgOAuthConfig(organizationId, portal)` is the lookup; `OAUTH_FIELD_HINTS` in that same file provides placeholder text only, never a default value. Ramp's authorize/token URLs happen to be genuinely global (Ramp docs confirm this), but its client id/secret are still per-company, so it follows the same per-org entry pattern as the rest for consistency.

3. **Organizations, not individuals, own the data.** Billing is Clerk-Organization-scoped (a $400/mo plan purchased by the org), and **all portal connections, OAuth app credentials, cached purchase orders, and invoice submissions are shared across every member of an organization** — not owned by whichever individual user connected them. `User` records exist only for audit trails (`connectedByUserId`, `submittedByUserId`).

4. **Free tier gets full product access.** Two Clerk plans: default "Free" org plan and $400/mo "Standard Plan." Both grant identical, full dashboard access (`hasDashboardAccess` in `src/lib/billing.ts` is true for either). The paid plan is opt-in upsell revenue, not a feature gate. (The Free plan is meant to be hidden from the public `<PricingTable />` via a Clerk Dashboard toggle so only Standard shows as purchasable — manual dashboard step, not in code.)

5. **Built for arbitrarily more portals.** Portal display metadata lives in one array (`src/lib/portals/registry.ts`) with `available`/`authType` ("oauth" or "api_key") per entry, and an `available: false` "coming soon" mode for future integrations not yet implemented. Marketing copy is genericized (e.g. "connect your customers' procurement portals," not naming specific portals) except the homepage's "Integrations" section, which lists every available portal by name from the same registry.

6. **Never fake success silently.** The actual portal API integration (`src/lib/portals/sync.ts`) is stubbed — no live tenant credentials/API calls exist yet for pulling POs or submitting invoices, regardless of how well OAuth/connection is wired up. Rather than silently pretend every submission succeeded, the stub returns an explicit, visible message: *"Stub confirmation — no live \[Portal] API call was made."* This flows into `portalMessage` on every submission and is shown in the UI.

7. **Per-page auth checks, not centralized middleware.** Every protected page/route calls `getSubscriptionStatus()` itself and redirects/errors inline, rather than relying on middleware to gate access. New protected routes should follow this same pattern.

## What's built and working today

- **Landing page** (`/`) — hero ("Many Portals, One Gateway"), 3-step how-it-works, an "Integrations" section listing all connected portals, and a $400/mo pricing card. Live at Gateway-Sync.com.
- **Auth** — Clerk sign-up/sign-in (email + Google), production instance, email verification handled by Clerk.
- **Onboarding** (`/onboarding`) — prompts a signed-in user with no organization to create one.
- **Billing** (`/billing`) — `<PricingTable for="organization" />`; only reachable/relevant as an upgrade path, since free already grants dashboard access.
- **Portal Links** (`/dashboard/portal-links`) — one card per portal from `PORTAL_REGISTRY`:
  - OAuth portals (Coupa, Ariba, Procurify, Zycus, AvidXchange, Ramp, Stampli): a collapsible form to enter that org's own OAuth app credentials (`OAuthPortalCard`), then Connect/Reconnect once configured.
  - Tipalti: a password-masked API key field (`ApiKeyConnectForm`).
  - Connect success/error banners, including a "not configured" state per-org (not platform-wide) if credentials haven't been entered yet.
- **Dashboard** (`/dashboard`) — consolidated purchase order table with generic column filter/sort, "Submit invoice" dialog with dynamically rendered required fields + optional PDF attachment, Excel template download/import, and export.
- **Submitted invoices** (`/dashboard/submissions`) — org-wide submission history with audit fields and a **Notes** column showing `portalMessage`.
- **Shared header/footer** (`src/components/site-header.tsx`, `site-footer.tsx`) — used on every page; footer includes a support email (Support@Gateway-sync.com).

## What's intentionally stubbed / not real yet

- **`src/lib/portals/sync.ts`** — `syncPurchaseOrders()` and `submitInvoiceToPortal()` are stubs regardless of portal or connection status. No live API calls happen for any portal yet. This is the integration point to fill in once a real org has real credentials connected.
- **No token refresh logic** — `PortalConnection.refreshTokenCipher`/`tokenExpiresAt` are stored but nothing automatically refreshes an expiring access token. Once one expires, the org has to click "Reconnect."
- **Hiding the Free plan from `<PricingTable />`** needs a manual Clerk Dashboard toggle (Subscription Plans → Free → "Publicly available" off). No confirmed working Backend API endpoint was found for this (a direct PATCH attempt 404'd; Clerk Billing is still Beta).

## Architecture

**Stack:** Next.js 16 (App Router, TypeScript, Turbopack) · Clerk (auth + Organizations + Billing/Stripe) · PostgreSQL + Prisma 7 (via `@prisma/adapter-pg` driver adapter) · Tailwind CSS v4 + shadcn/ui (Base UI primitives, not Radix) · exceljs · lucide-react. Deployed on Vercel with Vercel Postgres.

**Data model** (`prisma/schema.prisma`):
- `Organization` (clerkOrgId) — the billing and data-sharing unit
- `User` (clerkId, email) — audit trail only
- `PortalConnection` (organizationId, portal enum, encrypted access/refresh token or API key, `connectedByUserId`) — one per org per portal, the *established* connection
- `PortalOAuthClient` (organizationId, portal, authorizeUrl, tokenUrl, clientId, encrypted clientSecret, scope) — one per org per **OAuth** portal, the org's own registered app credentials, entered *before* a `PortalConnection` can exist for that portal. No Tipalti row (it only needs `PortalConnection`, via the API-key connect path).
- `PurchaseOrder` (portalConnectionId, externalPoNumber, requiredFields JSON, rawData JSON) — cached snapshot
- `InvoiceSubmission` (organizationId, submittedByUserId, purchaseOrderId, submittedFields JSON, status enum, `portalMessage` text, `portalResponse` JSON)

**Access gating** (`src/lib/billing.ts`): `getSubscriptionStatus()` returns `{ userId, orgId, hasDashboardAccess, hasPaidPlan }`. `hasDashboardAccess` is true for either `org:free_org` or `org:standard_plan`.

**Key routes:**
```
/                                     landing page
/sign-in, /sign-up                    Clerk hosted auth
/onboarding                           create an organization
/billing                              upgrade (PricingTable)
/dashboard                            PO table
/dashboard/portal-links               connect portals (OAuth app config + connect, or API key)
/dashboard/submissions                invoice history + notes
/api/portals/[provider]/oauth-client  save an org's own OAuth app credentials
/api/portals/[provider]/authorize     OAuth redirect out (org-scoped config)
/api/portals/[provider]/callback      OAuth redirect back, token exchange (org-scoped config)
/api/portals/[provider]/connect       Tipalti API key connect
/api/invoices                         single invoice submission
/api/import, /api/import/template     bulk Excel import / template download
/api/export                           PO list export
```

## Known local dev-environment quirks

- **Local Postgres via `prisma dev`**: the shadow database `prisma migrate dev` needs has repeatedly gotten stuck with stale state (recurring `type "X" already exists` error, or `type "Portal" already exists` when adding enum values). When this happens: write the migration SQL by hand into a new `prisma/migrations/<timestamp>_<name>/migration.sql` folder (mirroring the style of existing migrations), then run `npx prisma migrate deploy` instead of `migrate dev` — that applies directly without touching the shadow database. Works reliably; used repeatedly for every portal-enum addition and for the `PortalOAuthClient` table.
- **Node.js isn't in PATH** for already-running shells on this machine. Bash commands need `export PATH="/c/Program Files/nodejs:$PATH"` prefixed, or reference the tool directly.
- **No Python installed** (only the Windows Store stub alias) — if a task needs Python (e.g. the `pdf` skill defaults to reportlab/pypdf), pivot to a Node.js equivalent (e.g. `pdf-lib`) instead of assuming Python is available.
- **PowerShell blocks `npx`** by default (`npx` resolves to `npx.ps1`, and PowerShell's execution policy blocks running `.ps1` scripts) — use `npx.cmd` instead of `npx` when giving the user PowerShell commands to run themselves.
- **Turbopack/`.next` cache** has gone stale a few times after rapid edits, throwing `ReferenceError`s for imports already removed from source. Fix: `rm -rf .next` and restart the dev server.
- **No real Clerk login is available to Claude** in this environment's sandboxed browser for *this* session's dev server — but the production site (Gateway-Sync.com) has been verified end-to-end via the Browser tools (sign-up modal renders, DNS/SSL for Clerk's `clerk.gateway-sync.com` subdomain confirmed working) since it doesn't require local auth.
- **`src/generated/prisma` is gitignored** and not committed — `package.json`'s `build` script must run `prisma generate` before `next build`, or a fresh checkout (like Vercel's) fails on missing modules. Already fixed; don't remove it.

## Suggested next steps

1. Implement the real API calls in `src/lib/portals/sync.ts` once at least one organization has real OAuth app credentials + a completed connection for some portal.
2. Toggle the Free plan's "Publicly available" off in the Clerk Dashboard so only Standard Plan shows in `<PricingTable />`.
3. Consider token-refresh logic for OAuth portals (`refreshTokenCipher`/`tokenExpiresAt` are stored but unused) so connections don't silently go stale.
4. Click through the full connect-a-portal flow for at least one real OAuth portal end-to-end (enter OAuth app credentials → Connect → real portal login → callback → token stored) to validate the new per-org `PortalOAuthClient` flow against a live instance, not just locally.
