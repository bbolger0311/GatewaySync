"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { PurchaseOrder } from "@/generated/prisma/client";

type RequiredField = { label: string; type?: "text" | "number" | "date" };
type Row = Pick<PurchaseOrder, "id" | "externalPoNumber" | "requiredFields">;
type SubmitStatus = "idle" | "submitting" | "confirmed" | "failed";

export function SubmitInvoiceDialog({
  purchaseOrder,
  onOpenChange,
}: {
  purchaseOrder: Row | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fields = (purchaseOrder?.requiredFields as Record<string, RequiredField>) ?? {};

  async function handleSubmit() {
    if (!purchaseOrder) return;
    setStatus("submitting");
    setResultMessage(null);

    const formData = new FormData();
    formData.set("purchaseOrderId", purchaseOrder.id);
    formData.set("fields", JSON.stringify(values));
    if (file) formData.set("attachment", file);

    const res = await fetch("/api/invoices", { method: "POST", body: formData });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    if (res.ok) {
      setResultMessage(data?.message ?? null);
      setStatus("confirmed");
      return;
    }
    setResultMessage(data?.error ?? null);
    setStatus("failed");
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setValues({});
      setFile(null);
      setStatus("idle");
      setResultMessage(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={!!purchaseOrder} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit invoice &mdash; PO {purchaseOrder?.externalPoNumber}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {Object.entries(fields).map(([key, field]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={key}>{field.label}</Label>
              <Input
                id={key}
                type={field.type === "date" || field.type === "number" ? field.type : "text"}
                value={values[key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </div>
          ))}
          {Object.keys(fields).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No required fields were returned for this PO.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attachment">Attach PDF invoice</Label>
            <Input
              id="attachment"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {status === "confirmed" && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {resultMessage ?? "Submission confirmed."}
            </p>
          )}
          {status === "failed" && (
            <p className="text-sm text-destructive">
              {resultMessage ?? "Submission failed. Please try again."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
