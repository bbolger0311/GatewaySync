import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Users, Eye, Layers } from "lucide-react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How GatewaySync consolidates procurement portal invoice submission: OAuth-linked portal connections, one purchase order table, per-PO submission with status tracking, and bulk Excel import.",
  alternates: { canonical: "/how-it-works" },
};

const CAPABILITIES = [
  {
    title: "Connect each portal once",
    body: "Authorize GatewaySync against your own Coupa, Ariba, Procurify, Zycus, AvidXchange, Ramp, or Stampli instance — every connection redirects to that portal's own hosted login, so your credentials never touch our servers. Tipalti, which has no OAuth flow, connects with an API key from your Implementation Manager instead.",
  },
  {
    title: "See every open PO in one table",
    body: "Open purchase orders from every connected portal land in a single consolidated table, filterable and sortable by PO number, source portal, vendor, and required fields — instead of checking each portal separately.",
  },
  {
    title: "Submit against the portal's own requirements",
    body: "Each purchase order's submission form is built from that portal's actual required fields, with an optional PDF attachment. Submit it, and GatewaySync tracks the confirmation status right on that PO's row.",
  },
  {
    title: "Bulk submit with Excel when volume is high",
    body: "Download a submission template pre-filled with every open PO and its required fields, fill it out offline, and re-import it — each row submits and is isolated from the others, so one bad row never blocks the rest of the batch.",
  },
];

const PHILOSOPHY = [
  {
    icon: ShieldCheck,
    title: "Security by design, not by policy",
    body: "OAuth is the default for every portal that supports it — GatewaySync's server only ever sees a one-time authorization code, never a password. Access and refresh tokens are encrypted at rest. Tipalti's API key is the one deliberate exception, because its Procurement API genuinely has no OAuth option.",
  },
  {
    icon: Layers,
    title: "Your own tenant, never a shared client",
    body: "There's no platform-wide OAuth app for any portal. Every organization registers its own client against its own Coupa, Ariba, or other instance — because two GatewaySync customers are almost always talking to two entirely different buyer tenants, not the same one.",
  },
  {
    icon: Users,
    title: "The organization owns the data, not one user",
    body: "Portal connections, cached purchase orders, and submission history are shared across everyone in your organization — not locked to whoever happened to connect a portal first. Anyone on the team can pick up where a teammate left off.",
  },
  {
    icon: Eye,
    title: "Never fake success",
    body: "If a submission doesn't go through cleanly, you see that immediately — GatewaySync surfaces the portal's actual response rather than silently marking it done. A purchase order stays visible and ready to retry until it genuinely succeeds.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-20 px-6 py-24">
        <section className="flex flex-col items-center gap-5 text-center">
          <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">
            How it works
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
            One dashboard for every procurement portal you touch
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            GatewaySync doesn&rsquo;t replace your customers&rsquo; procurement portals &mdash;
            it consolidates them, so your team stops logging into eight different systems to do
            one job: get invoices submitted.
          </p>
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

        <section className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">What it does</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Four capabilities that cover the full path from a connected portal to a confirmed
              submission.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <Card key={c.title}>
                <CardHeader className="gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {i + 1}
                  </span>
                  <h3 className="font-heading text-base leading-snug font-medium">{c.title}</h3>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Our philosophy</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              The decisions that shape how GatewaySync is built, not just what it does.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {PHILOSOPHY.map((p) => (
              <Card key={p.title}>
                <CardHeader className="gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <p.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="font-heading text-base leading-snug font-medium">{p.title}</h3>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-secondary/40 px-8 py-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            See which portals GatewaySync connects to
          </h2>
          <Link href="/integrations" className="text-sm font-medium text-primary hover:underline">
            Browse all integrations →
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
