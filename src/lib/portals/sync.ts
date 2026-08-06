import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import type { Prisma, PortalConnection } from "@/generated/prisma/client";

// Pulls open purchase orders (and their invoice submission field
// requirements) from a portal's API and upserts them into the local
// cache. The exact endpoint/shape differs per portal — see the API
// references in the requirements doc — so this is left as the
// integration point to fill in against a live Coupa/Ariba tenant.
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
// whether the portal confirmed or rejected the submission.
export async function submitInvoiceToPortal(): Promise<{
  ok: boolean;
  response: Prisma.InputJsonValue;
}> {
  // TODO: POST the submission to the portal's invoice endpoint using
  // the connection's decrypted access token, and surface its real
  // response here instead of this stub.
  return { ok: true, response: { stub: true } };
}
