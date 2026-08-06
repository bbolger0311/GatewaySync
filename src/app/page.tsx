import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-semibold tracking-tight">Portal Bridge</span>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Sign up</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button variant="ghost" render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-20">
        <section className="flex flex-col gap-6">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-balance">
            One platform to submit invoices to Coupa and Ariba
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Connect your Coupa and Ariba accounts once, and Portal Bridge pulls every
            open purchase order into a single consolidated view &mdash; so your team
            submits invoices from one place instead of switching between portals.
          </p>
          <div className="flex gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <Button size="lg">Get started</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button size="lg" render={<Link href="/dashboard" />}>
                Go to dashboard
              </Button>
            </Show>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Link your portals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Authorize Portal Bridge to connect to your Coupa and Ariba accounts
              &mdash; each connection uses that portal&rsquo;s own OAuth sign-in, so
              your credentials never touch our servers.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. See every open PO</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Open purchase orders from both portals appear in one table, each row
              tagged with its source and the fields required to invoice against it.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Submit in place</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fill out the required fields, attach a PDF if needed, and submit
              &mdash; Portal Bridge routes it to the right portal and tracks the
              confirmation status.
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-6 text-sm text-muted-foreground">
          Portal Bridge &mdash; internal invoice submission platform
        </div>
      </footer>
    </div>
  );
}
