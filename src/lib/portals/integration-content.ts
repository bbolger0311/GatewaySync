// Marketing copy for the /integrations/[key] landing pages, keyed the same
// way as PORTAL_REGISTRY. Kept separate from registry.ts, which drives the
// product's own Portal Links connect UI rather than public-facing content.
export interface IntegrationContent {
  headline: string;
  intro: string;
  setupNote: string;
}

export const INTEGRATION_CONTENT: Record<string, IntegrationContent> = {
  coupa: {
    headline: "Coupa invoice submission, without leaving GatewaySync",
    intro:
      "Connect your organization's Coupa instance once, and every open purchase order syncs into GatewaySync's consolidated table — ready to invoice against alongside every other portal you work with.",
    setupNote:
      "Coupa is a per-tenant instance (yourcompany.coupahost.com), so there's no shared GatewaySync client — you register your own OAuth2/OpenID Connect client under Coupa's Setup → Integrations menu and enter the resulting credentials on the Portal Links page.",
  },
  ariba: {
    headline: "SAP Ariba purchase orders, consolidated in GatewaySync",
    intro:
      "Link your organization's SAP Ariba realm and GatewaySync pulls in every open purchase order, so your team submits invoices from one dashboard instead of Ariba's own portal.",
    setupNote:
      "SAP Ariba's API is scoped per realm — you register your own OAuth client in your Ariba realm and enter the authorize/token URLs and credentials on the Portal Links page.",
  },
  procurify: {
    headline: "Procurify invoicing, consolidated in GatewaySync",
    intro:
      "Connect your company's Procurify account and every open purchase order appears in GatewaySync's single view, ready to invoice against alongside the rest of your procurement portals.",
    setupNote:
      "Procurify's OAuth app is registered per company instance — you create it in your own Procurify account and enter the resulting client credentials on the Portal Links page.",
  },
  zycus: {
    headline: "Zycus purchase orders, one dashboard away",
    intro:
      "Link your organization's Zycus instance and its open purchase orders join every other connected portal in GatewaySync's consolidated table.",
    setupNote:
      "Zycus's OAuth app is registered per company instance — you create it in your own Zycus account and enter the resulting client credentials on the Portal Links page.",
  },
  avidxchange: {
    headline: "AvidXchange invoicing, without switching tabs",
    intro:
      "Connect your organization's AvidXchange account and its open purchase orders sync into GatewaySync alongside every other portal your team submits invoices to.",
    setupNote:
      "AvidXchange's OAuth app is registered per company instance — you create it in your own AvidXchange account and enter the resulting client credentials on the Portal Links page.",
  },
  tipalti: {
    headline: "Tipalti Procurement API, no OAuth setup required",
    intro:
      "Tipalti's Procurement API skips OAuth entirely — paste in the API key your Tipalti Implementation Manager issues, and its open purchase orders join GatewaySync's consolidated table.",
    setupNote:
      "Unlike the other portals here, Tipalti has no OAuth flow — you enter a static API key (issued by your Tipalti Implementation Manager) directly on the Portal Links page, scoped to sandbox or production.",
  },
  ramp: {
    headline: "Ramp bills, consolidated in GatewaySync",
    intro:
      "Connect your organization's Ramp account and its open purchase orders sync into GatewaySync, ready to submit as bills alongside every other portal you work with.",
    setupNote:
      "Ramp's OAuth endpoints are the same for every customer (unlike the per-tenant portals here) — you still register your own client in Ramp and enter the credentials on the Portal Links page.",
  },
  stampli: {
    headline: "Stampli invoicing, in the same view as everything else",
    intro:
      "Link your organization's Stampli account and its open purchase orders join GatewaySync's consolidated table, ready to invoice against alongside every other connected portal.",
    setupNote:
      "Stampli's OAuth app is registered per company instance — you create it in your own Stampli account and enter the resulting client credentials on the Portal Links page.",
  },
};
