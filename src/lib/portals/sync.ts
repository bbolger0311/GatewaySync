import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import type { Portal, Prisma, PortalConnection } from "@/generated/prisma/client";

const PORTAL_LABELS: Record<Portal, string> = {
  COUPA: "Coupa",
  ARIBA: "Ariba",
  PROCURIFY: "Procurify",
  ZYCUS: "Zycus",
  AVIDXCHANGE: "AvidXchange",
  TIPALTI: "Tipalti",
  RAMP: "Ramp",
  STAMPLI: "Stampli",
};

// Pulls open purchase orders (and their invoice submission field
// requirements) from a portal's API and upserts them into the local
// cache. The exact endpoint/shape differs per portal — see the API
// references in the requirements doc — so this is left as the
// integration point to fill in against a live tenant. accessTokenCipher
// holds an OAuth bearer token for OAuth portals, or the raw API key for
// Tipalti (sent as an x-api-key header, not a Bearer token — see
// lib/portals/config.ts's getTipaltiBaseUrl).
export async function syncPurchaseOrders(connection: PortalConnection) {
  const accessToken = decrypt(connection.accessTokenCipher);

  // TODO: call the portal's open-PO endpoint with `accessToken`, then
  // upsert each result via prisma.purchaseOrder.upsert(...) keyed on
  // [portalConnectionId, externalPoNumber].
  void accessToken;

  return prisma.purchaseOrder.findMany({
    where: { portalConnectionId: connection.id },
    orderBy: { lastSyncedAt: "desc" },
  });
}

// Submits a filled-out invoice to the source portal for a PO. Returns
// whether the portal confirmed or rejected the submission, plus a
// human-readable note for the submissions history.
export async function submitInvoiceToPortal(portal: Portal): Promise<{
  ok: boolean;
  message: string;
  response: Prisma.InputJsonValue;
}> {
  // TODO: POST the submission to the portal's invoice endpoint using
  // the connection's decrypted access token, and surface its real
  // confirmation/rejection message and response here instead of this stub.
  return {
    ok: true,
    message: `Stub confirmation — no live ${PORTAL_LABELS[portal]} API call was made. Wire up real credentials in lib/portals/sync.ts to submit for real.`,
    response: { stub: true },
  };
}
