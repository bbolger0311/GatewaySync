import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PORTAL_REGISTRY } from "@/lib/portals/registry";
import { INTEGRATION_CONTENT } from "@/lib/portals/integration-content";

type Params = { key: string };

export function generateStaticParams() {
  return PORTAL_REGISTRY.filter((p) => p.available).map((p) => ({ key: p.key }));
}

function getPortal(key: string) {
  const portal = PORTAL_REGISTRY.find((p) => p.key === key && p.available);
  const content = INTEGRATION_CONTENT[key];
  if (!portal || !content) return null;
  return { portal, content };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { key } = await params;
  const found = getPortal(key);
  if (!found) return {};

  const { portal, content } = found;
  return {
    title: `${portal.label} Integration`,
    description: content.intro,
    alternates: { canonical: `/integrations/${portal.key}` },
    openGraph: { title: `${portal.label} Integration | GatewaySync`, description: content.intro },
    twitter: { title: `${portal.label} Integration | GatewaySync`, description: content.intro },
  };
}

export default async function IntegrationPage({ params }: { params: Promise<Params> }) {
  const { key } = await params;
  const found = getPortal(key);
  if (!found) notFound();

  const { portal, content } = found;
  const otherPortals = PORTAL_REGISTRY.filter((p) => p.available && p.key !== portal.key);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-6 py-24">
        <section className="flex flex-col gap-5">
          <Link
            href="/integrations"
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            ← All integrations
          </Link>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
            {content.headline}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{content.intro}</p>
          <div className="flex gap-3 pt-1">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <Button size="lg" className="shadow-sm shadow-primary/20">
                  Get started
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/dashboard" />}
                className="shadow-sm shadow-primary/20"
              >
                Go to dashboard
              </Button>
            </Show>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {[
            {
              title: `Link ${portal.label}`,
              body: portal.description,
            },
            {
              title: "See every open PO",
              body: "Open purchase orders from every connected portal appear in one table, tagged by source.",
            },
            {
              title: "Submit in one place",
              body: "Fill out the required fields and submit — GatewaySync routes it to the right portal and tracks confirmation status.",
            },
          ].map((step, i) => (
            <Card key={step.title}>
              <CardHeader className="gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {i + 1}
                </span>
                <h3 className="font-heading text-base leading-snug font-medium">{step.title}</h3>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <Card>
            <CardHeader className="gap-2">
              <h2 className="font-heading text-base font-medium">
                Connecting {portal.label} to GatewaySync
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              <p>{content.setupNote}</p>
              <p>
                {portal.authType === "oauth"
                  ? "Every organization registers its own OAuth app — GatewaySync never has a shared, platform-wide client for this portal."
                  : "This connection uses a static API key rather than an OAuth flow."}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <span className="text-sm font-medium text-muted-foreground">Also connects with</span>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {otherPortals.map((p) => (
              <Badge
                key={p.key}
                variant="secondary"
                className="px-3 py-1.5 text-sm font-medium"
                render={<Link href={`/integrations/${p.key}`} />}
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
