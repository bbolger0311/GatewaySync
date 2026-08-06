"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = "idle" | "submitting" | "error";

export function ApiKeyConnectForm({
  portalKey,
  connected,
  label,
}: {
  portalKey: string;
  connected: boolean;
  label: string;
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setStatus("submitting");
    setError(null);

    const res = await fetch(`/api/portals/${portalKey}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setStatus("error");
      setError(data?.error ?? "Failed to connect.");
      return;
    }
    setApiKey("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        type="password"
        placeholder={connected ? `New ${label} API key` : `${label} API key`}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        autoComplete="off"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        variant={connected ? "outline" : "default"}
        size="sm"
        className="w-fit"
        disabled={status === "submitting" || !apiKey.trim()}
      >
        {status === "submitting" ? "Connecting…" : connected ? "Update key" : `Connect ${label}`}
      </Button>
    </form>
  );
}
