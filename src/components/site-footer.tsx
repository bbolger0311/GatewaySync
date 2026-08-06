const SUPPORT_EMAIL = "Support@Gateway-sync.com";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>GatewaySync &mdash; internal invoice submission platform</span>
        <span>
          Billing or technical questions?{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-foreground hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </span>
      </div>
    </footer>
  );
}
