"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Status = "idle" | "submitting" | "error";

export function OAuthPortalCard({
  portalKey,
  label,
  connected,
  configured,
  existingClientId,
  hint,
}: {
  portalKey: string;
  label: string;
  connected: boolean;
  configured: boolean;
  existingClientId: string | null;
  hint: { authorizeUrl: string; tokenUrl: string; scope: string };
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(!configured);
  const [authorizeUrl, setAuthorizeUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = authorizeUrl.trim() && tokenUrl.trim() && clientId.trim() && clientSecret.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setError(null);

    const res = await fetch(`/api/portals/${portalKey}/oauth-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorizeUrl, tokenUrl, clientId, clientSecret, scope }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setStatus("error");
      setError(data?.error ?? "Failed to save credentials.");
      return;
    }
    setStatus("idle");
    setAuthorizeUrl("");
    setTokenUrl("");
    setClientId("");
    setClientSecret("");
    setScope("");
    setShowForm(false);
    router.refresh();
  }

  const idPrefix = `${portalKey}-oauth`;

  return (
    <div className="flex flex-col gap-3">
      {configured && !showForm && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            OAuth app configured{existingClientId ? ` — Client ID: ${existingClientId}` : ""}.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={connected ? "outline" : "default"}
              size="sm"
              className="w-fit"
              nativeButton={false}
              render={<a href={`/api/portals/${portalKey}/authorize`} />}
            >
              {connected ? "Reconnect" : "Connect"} {label}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => setShowForm(true)}
            >
              Edit OAuth app credentials
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Register an OAuth app in your own {label} instance, then enter its credentials here.
            Every organization connects its own {label} tenant — there&rsquo;s no shared login.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-authorize-url`}>Authorize URL</Label>
            <Input
              id={`${idPrefix}-authorize-url`}
              placeholder={hint.authorizeUrl}
              value={authorizeUrl}
              onChange={(e) => setAuthorizeUrl(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-token-url`}>Token URL</Label>
            <Input
              id={`${idPrefix}-token-url`}
              placeholder={hint.tokenUrl}
              value={tokenUrl}
              onChange={(e) => setTokenUrl(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-client-id`}>Client ID</Label>
            <Input
              id={`${idPrefix}-client-id`}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-client-secret`}>Client secret</Label>
            <Input
              id={`${idPrefix}-client-secret`}
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-scope`}>Scope (optional)</Label>
            <Input
              id={`${idPrefix}-scope`}
              placeholder={hint.scope}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="w-fit" disabled={status === "submitting" || !canSubmit}>
              {status === "submitting" ? "Saving…" : "Save credentials"}
            </Button>
            {configured && (
              <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
