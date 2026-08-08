import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { OrganizationSwitcher, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <RefreshCw className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">
            Gateway<span className="text-primary">Sync</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" nativeButton={false} render={<Link href="/how-it-works" />}>
            How it works
          </Button>
          <Button variant="ghost" nativeButton={false} render={<Link href="/integrations" />}>
            Integrations
          </Button>
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="ghost">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            <OrganizationSwitcher
              hidePersonal
              createOrganizationMode="navigation"
              createOrganizationUrl="/onboarding"
              afterSelectOrganizationUrl="/dashboard"
            />
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
