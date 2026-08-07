import Link from "next/link";
import { Check } from "lucide-react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { PORTAL_REGISTRY } from "@/lib/portals/registry";

const STEPS = [
  {
    title: "Link your portals",
    body: "Authorize GatewaySync to connect to each of your customers’ procurement portals — every connection uses that portal’s own OAuth sign-in, so your credentials never touch our servers.",
  },
  {
    title: "See every open PO",
    body: "Open purchase orders from every connected portal appear in one table, each row tagged with its source and the fields required to invoice against it.",
  },
  {
    title: "Submit in one place",
    body: "Fill out the required fields, attach a PDF if needed, and submit — GatewaySync routes it to the right portal and tracks the confirmation status.",
  },
];

const PLAN_FEATURES = [
  "OAuth-linked procurement portal accounts",
  "Integration Support Included",
  "Consolidated purchase order table",
  "Submit invoices without leaving the site",
  "Excel import and export",
  "Full submission history",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-6 py-24">
        <section className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="flex flex-col gap-7">
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.1] tracking-tight text-balance">
              Many Portals, One Gateway
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Connect your customers&rsquo; portal accounts once, and GatewaySync pulls
              every open purchase order into a single consolidated view &mdash; so your
              team submits invoices from one place instead of switching between portals.
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
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end lg:text-right">
            <span className="text-3xl font-medium tracking-tight text-muted-foreground">
              Improve cash flow
            </span>
            <span className="text-3xl font-medium tracking-tight text-muted-foreground">
              Simplify AR
            </span>
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              Get paid easier
            </span>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card
              key={step.title}
              className="transition-shadow duration-200 hover:shadow-md hover:shadow-foreground/5"
            >
              <CardHeader className="gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {i + 1}
                </span>
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">
              Integrations
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Works with the portals you already use
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Link any of these procurement portals once and GatewaySync keeps every
              open purchase order in sync, ready to invoice against from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {PORTAL_REGISTRY.filter((p) => p.available).map((p) => (
              <Badge key={p.key} variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                {p.label}
              </Badge>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium tracking-wide text-secondary-foreground">
              Pricing
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              One plan, full access
            </h2>
          </div>

          <Card className="w-full max-w-sm text-left">
            <CardHeader className="gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">$999</span>
                <span className="text-muted-foreground">/mo per account</span>
              </div>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Everything you need to run invoices through your customers&rsquo; portals
                from one place.
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2.5 text-sm">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <Button size="lg" className="w-full shadow-sm shadow-primary/20">
                    Get started
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/dashboard" />}
                  className="w-full shadow-sm shadow-primary/20"
                >
                  Go to dashboard
                </Button>
              </Show>
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
