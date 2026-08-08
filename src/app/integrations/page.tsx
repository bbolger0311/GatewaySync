import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PORTAL_REGISTRY } from "@/lib/portals/registry";
import { INTEGRATION_CONTENT } from "@/lib/portals/integration-content";

export const metadata: Metadata = {
  title: "Procurement Portal Integrations",
  description:
    "GatewaySync connects to Coupa, Ariba, Procurify, Zycus, AvidXchange, Tipalti, Ramp, and Stampli — link each once and submit invoices from a single consolidated dashboard.",
  alternates: { canonical: "/integrations" },
};

export default function IntegrationsIndexPage() {
  const portals = PORTAL_REGISTRY.filter((p) => p.available);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">
            Integrations
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
            Procurement Portal Integrations
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Link any of these procurement portals once and GatewaySync keeps every open
            purchase order in sync, ready to invoice against from one place.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((p) => {
            const content = INTEGRATION_CONTENT[p.key];
            return (
              <Card
                key={p.key}
                className="transition-shadow duration-200 hover:shadow-md hover:shadow-foreground/5"
              >
                <Link href={`/integrations/${p.key}`} className="flex flex-1 flex-col">
                  <CardHeader className="gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-heading text-base font-medium">{p.label}</h2>
                      <Badge variant="outline" className="shrink-0">
                        {p.authType === "oauth" ? "OAuth" : "API key"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-muted-foreground">
                    {content?.intro ?? p.description}
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
