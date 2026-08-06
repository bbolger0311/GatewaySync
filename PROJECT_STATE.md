# GatewaySync — Project State

*Last updated: 2026-08-06. This document is a handoff/context snapshot — read it first in any new session before making changes.*

## What this is

GatewaySync ("Many Portals, One Gateway") is a consolidated invoice submission platform. Customers connect their procurement portal accounts (Coupa, Ariba today; designed to support more) once, and GatewaySync pulls every open purchase order from all of them into a single table — so a team submits invoices from one place instead of logging into each portal separately.

Originally scaffolded as "Portal Bridge," renamed to "PortalSync," then to its current name "GatewaySync" as the product positioning shifted from "we support Coupa and Ariba" to "we support many portals."

## Philosophy — the decisions that shape the codebase

These aren't obvious from the code alone; they're product decisions made over the course of building this, and future work should stay consistent with them unless the user says otherwise.

1. **OAuth only, never passwords.** Linking a portal always redirects the browser to that portal's own hosted login (`https://<instance>.coupahost.com/oauth2/authorize`, etc.). GatewaySync's server only ever receives a one-time authorization code and exchanges it server-side for a token, which is encrypted at rest (AES-256-GCM). A customer's Coupa/Ariba password never touches this app. This was an explicit, non-negotiable requirement — don't offer an API-key-paste-in alternative.

2. **Organizations, not individuals, own the data.** Billing is Clerk-Organization-scoped (a $400/mo plan purchased by the org), and per an explicit decision, **all portal connections, cached purchase orders, and invoice submissions are shared across every member of an organization** — not owned by whichever individual user connected them. `User` records still exist, but only for audit trails (`connectedByUserId`, `submittedByUserId`), not ownership.

3. **Free tier gets full product access.** There are two Clerk plans: a default "Free" org plan and the $400/mo "Standard Plan." Both grant identical, full dashboard access (`hasDashboardAccess` in `src/lib/billing.ts` is true for either). The paid plan is opt-in upsell revenue, not a feature gate — don't reintroduce a paywall on `/dashboard` without being asked. (The Free plan is meant to be hidden from the public `<PricingTable />` via a Clerk Dashboard toggle so only Standard shows as purchasable — that's a manual dashboard step, not something in code.)

4. **Built for more portals than two.** Even though only Coupa and Ariba are implemented, the UI and data layer are deliberately generic: portal display metadata lives in a single array (`src/lib/portals/registry.ts`) with an `available: false` "coming soon" mode for future integrations, and all copy on the marketing site was genericized away from naming Coupa/Ariba specifically (e.g., "connect your customers' procurement portals," not "connect your Coupa and Ariba accounts").

5. **Never fake success silently.** The actual Coupa/Ariba API integration is stubbed (no real tenant credentials exist yet — see "What's stubbed" below). Rather than have the stub silently pretend every submission succeeded, it returns an explicit, visible message: *"Stub confirmation — no live \[Coupa/Ariba] API call was made."* This flows into a dedicated `portalMessage` field on every submission and is shown in the UI, so nobody mistakes a stub run for a real one.

6. **Per-page auth checks, not centralized middleware.** Clerk's `createRouteMatcher`-based middleware auth is deprecated in favor of resource-based checks (the dev server logs this warning). Every protected page/route calls `getSubscriptionStatus()` itself and redirects/errors inline, rather than relying on `src/proxy.ts` to gate access. New protected routes should follow this same pattern.

## What's built and working today

- **Landing page** (`/`) — hero ("Many Portals, One Gateway"), a 3-step how-it-works section, and a $400/mo pricing card. Fully portal-agnostic copy.
- **Auth** — Clerk sign-up/sign-in (email + Google), email verification handled by Clerk.
- **Onboarding** (`/onboarding`) — prompts a signed-in user with no organization to create one (`<CreateOrganization />`).
- **Billing** (`/billing`) — `<PricingTable for="organization" />`; only reachable/relevant as an upgrade path, since free already grants dashboard access.
- **Portal Links** (`/dashboard/portal-links`) — connect/reconnect Coupa and Ariba via OAuth; renders from the extensible `PORTAL_REGISTRY`; shows connect success/error banners.
- **Dashboard** (`/dashboard`) — consolidated purchase order table with:
  - A generic column filter (pick any column: PO Number, Source, Vendor, Required fields; filter text matches that column)
  - A generic column sort (pick a column + direction; direction labels adapt — "A to Z"/"Z to A" for text, "Low to high"/"High to low" for the numeric Required-fields column), Excel-style
  - "Submit invoice" per row → dialog with dynamically rendered required fields (from the PO's own `requiredFields` JSON), optional PDF attachment, and the actual result message shown after submitting
  - "Download template" → generates an `.xlsx` pre-filled with open POs and a column per distinct required field (columns not applicable to a given PO's portal are marked `N/A`)
  - "Import from Excel" → uploads a filled-in template, matches rows to POs by PO Number, submits each, shows a summary count
  - "Export to Excel" → plain PO list export
- **Submitted invoices** (`/dashboard/submissions`) — full org-wide submission history with PO Number, Source, Submitted by (audit), Submitted date, Status, and a **Notes** column showing each submission's `portalMessage`.
- **Shared header** (`src/components/site-header.tsx`) — brand mark (Manrope wordmark, "Gateway" + accent-colored "Sync"), sticky/blurred, sign-in/up when signed out, Dashboard link + `OrganizationSwitcher` + `UserButton` when signed in. Used on every page.

## What's intentionally stubbed / not real yet

- **`src/lib/portals/sync.ts`** — `syncPurchaseOrders()` and `submitInvoiceToPortal()` are stubs. No live Coupa/Ariba API calls happen. This is the single integration point to fill in once real tenant OAuth credentials exist.
- **`.env`** — `COUPA_AUTHORIZE_URL`/`COUPA_TOKEN_URL` still have placeholder `<your-instance>` text, and `COUPA_CLIENT_ID`/`SECRET` and all `ARIBA_*` vars are blank. Clicking "Connect" for an unconfigured portal fails gracefully (redirects with a clear "not configured" message) rather than crashing.
- **Hiding the Free plan from `<PricingTable />`** needs a manual Clerk Dashboard toggle (Subscription Plans → Free → "Publicly available" off). No confirmed working Backend API endpoint was found for this (a direct PATCH attempt 404'd; Clerk Billing is still Beta).

## Architecture

**Stack:** Next.js 16 (App Router, TypeScript, Turbopack) · Clerk (auth + Organizations + Billing/Stripe) · PostgreSQL + Prisma 7 (via `@prisma/adapter-pg` driver adapter) · Tailwind CSS v4 + shadcn/ui (Base UI primitives, not Radix) · exceljs · lucide-react.

**Data model** (`prisma/schema.prisma`):
- `Organization` (clerkOrgId) — the billing and data-sharing unit
- `User` (clerkId, email) — audit trail only
- `PortalConnection` (organizationId, portal enum `COUPA`/`ARIBA`, encrypted OAuth tokens, `connectedByUserId`) — one per org per portal, `@@unique([organizationId, portal])`
- `PurchaseOrder` (portalConnectionId, externalPoNumber, requiredFields JSON, rawData JSON) — cached snapshot
- `InvoiceSubmission` (organizationId, submittedByUserId, purchaseOrderId, submittedFields JSON, status enum, `portalMessage` text, `portalResponse` JSON)

**Access gating** (`src/lib/billing.ts`): `getSubscriptionStatus()` returns `{ userId, orgId, hasDashboardAccess, hasPaidPlan }`. `hasDashboardAccess` is true for either `org:free_org` or `org:standard_plan`; `hasPaidPlan` is true only for the Standard plan and is used solely by `/billing` to decide whether to show the pricing table or bounce straight to `/dashboard`.

**Key routes:**
```
/                                     landing page
/sign-in, /sign-up                    Clerk hosted auth
/onboarding                           create an organization
/billing                              upgrade (PricingTable)
/dashboard                            PO table
/dashboard/portal-links               connect Coupa/Ariba/future portals
/dashboard/submissions                invoice history + notes
/api/portals/[provider]/authorize     OAuth redirect out
/api/portals/[provider]/callback      OAuth redirect back, token exchange
/api/invoices                         single invoice submission
/api/import, /api/import/template     bulk Excel import / template download
/api/export                           PO list export
```

## Known local dev-environment quirks

- **Local Postgres via `prisma dev`**: the shadow database `prisma migrate dev` needs has repeatedly gotten stuck with stale state (recurring `type "X" already exists` error). When this happens: `npx prisma dev rm <name>` then recreate, then use `npx prisma db push` (bypasses the broken shadow db) to sync the schema, then rebuild migration history with `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` written into a fresh migration folder, followed by `npx prisma migrate resolve --applied <name>`. **Always check row counts in every table first** (a small script with the `pg` package works) before running anything destructive, and get explicit user confirmation before `migrate reset` or `db push --accept-data-loss` — Prisma's CLI itself blocks these for AI agents without a `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var containing the user's literal consent text.
- **Node.js isn't in PATH** for already-running shells on this machine. Bash commands need `export PATH="/c/Program Files/nodejs:$PATH"` prefixed. The dev server preview (`.claude/launch.json`) uses a `cmd.exe`-based PATH-injection workaround to run `npm run dev`.
- **Turbopack/`.next` cache** has gone stale a few times after rapid edits, throwing `ReferenceError`s for imports that were already removed from source. Fix: `rm -rf .next` and restart the dev server.
- **No real Clerk login is available to Claude** in this environment's sandboxed browser — authenticated-flow testing (the actual dashboard, portal connect flow, submission dialog) has only been verified by type-check/lint/build plus signed-out redirect behavior. The user needs to click through authenticated flows themselves after changes that touch them.

## Suggested next steps

1. Get real Coupa and/or Ariba OAuth app credentials (requires admin access to an actual tenant) and fill them into `.env`, then implement the real API calls in `src/lib/portals/sync.ts`.
2. Toggle the Free plan's "Publicly available" off in the Clerk Dashboard so only Standard Plan shows in `<PricingTable />`.
3. Click through the full authenticated flow at least once (sign up → create org → connect a portal → submit an invoice → check submissions history) to catch anything only visible when actually logged in.
