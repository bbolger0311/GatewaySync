"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitInvoiceDialog } from "./submit-invoice-dialog";
import type { PurchaseOrder } from "@/generated/prisma/client";

type LatestSubmission = { status: "PENDING" | "CONFIRMED" | "FAILED"; portalMessage: string | null };
type Row = Pick<
  PurchaseOrder,
  "id" | "portal" | "externalPoNumber" | "vendorName" | "requiredFields"
> & {
  invoiceSubmissions: LatestSubmission[];
};

const STATUS_VARIANT = {
  CONFIRMED: "default",
  FAILED: "destructive",
  PENDING: "secondary",
} as const;

type ColumnKey = "poNumber" | "source" | "vendor" | "requiredFields" | "lastSubmission";
type SortDirection = "asc" | "desc";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  numeric?: boolean;
  value: (po: Row) => string | number;
}

const COLUMNS: ColumnDef[] = [
  { key: "poNumber", label: "PO Number", value: (po) => po.externalPoNumber },
  { key: "source", label: "Source", value: (po) => po.portal },
  { key: "vendor", label: "Vendor", value: (po) => po.vendorName ?? "" },
  {
    key: "requiredFields",
    label: "Required fields",
    numeric: true,
    value: (po) => Object.keys((po.requiredFields as Record<string, unknown>) ?? {}).length,
  },
  {
    key: "lastSubmission",
    label: "Last submission",
    value: (po) => po.invoiceSubmissions[0]?.status ?? "Not submitted",
  },
];

function columnByKey(key: ColumnKey) {
  return COLUMNS.find((c) => c.key === key)!;
}

interface ImportRowResult {
  row: number;
  poNumber: string;
  status: "confirmed" | "failed" | "skipped";
  reason?: string;
}

export function PurchaseOrderTable({ purchaseOrders }: { purchaseOrders: Row[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterColumn, setFilterColumn] = useState<ColumnKey>("poNumber");
  const [filterValue, setFilterValue] = useState("");
  const [sortColumn, setSortColumn] = useState<ColumnKey | "none">("none");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [activeOrder, setActiveOrder] = useState<Row | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const rows = useMemo(() => {
    const filterCol = columnByKey(filterColumn);
    const needle = filterValue.trim().toLowerCase();
    const filtered = needle
      ? purchaseOrders.filter((po) => String(filterCol.value(po)).toLowerCase().includes(needle))
      : purchaseOrders;

    if (sortColumn === "none") return filtered;

    const sortCol = columnByKey(sortColumn);
    const sorted = [...filtered].sort((a, b) => {
      const av = sortCol.value(a);
      const bv = sortCol.value(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [purchaseOrders, filterColumn, filterValue, sortColumn, sortDirection]);

  const sortColumnDef = sortColumn === "none" ? null : columnByKey(sortColumn);

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportSummary(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = (await res.json()) as { results?: ImportRowResult[]; error?: string };

      if (!res.ok || !data.results) {
        setImportSummary(data.error ?? "Import failed.");
        return;
      }

      const confirmed = data.results.filter((r) => r.status === "confirmed").length;
      const failed = data.results.filter((r) => r.status === "failed").length;
      const skipped = data.results.filter((r) => r.status === "skipped").length;
      setImportSummary(`${confirmed} submitted, ${failed} failed, ${skipped} skipped.`);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter</span>
            <Select value={filterColumn} onValueChange={(v) => setFilterColumn(v as ColumnKey)}>
              <SelectTrigger size="sm">
                <SelectValue>{(value: ColumnKey) => columnByKey(value).label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={`Filter by ${columnByKey(filterColumn).label}`}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <Select
              value={sortColumn}
              onValueChange={(v) => setSortColumn(v as ColumnKey | "none")}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {(value: ColumnKey | "none") =>
                    value === "none" ? "None" : columnByKey(value).label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {COLUMNS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortDirection}
              onValueChange={(v) => setSortDirection(v as SortDirection)}
            >
              <SelectTrigger size="sm" disabled={!sortColumnDef}>
                <SelectValue>
                  {(value: SortDirection) => {
                    if (sortColumnDef?.numeric) {
                      return value === "asc" ? "Low to high" : "High to low";
                    }
                    return value === "asc" ? "A to Z" : "Z to A";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortColumnDef?.numeric ? (
                  <>
                    <SelectItem value="asc">Low to high</SelectItem>
                    <SelectItem value="desc">High to low</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="asc">A to Z</SelectItem>
                    <SelectItem value="desc">Z to A</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/api/import/template" />}
          >
            Download template
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" nativeButton={false} render={<a href="/api/export" />}>
            Export to Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? "Importing…" : "Import from Excel"}
          </Button>
        </div>
      </div>

      {importSummary && (
        <p className="rounded-md border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          {importSummary}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Required fields</TableHead>
              <TableHead>Last submission</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No purchase orders yet — connect a portal above to sync open POs.
                </TableCell>
              </TableRow>
            )}
            {rows.map((po) => {
              const latest = po.invoiceSubmissions[0];
              return (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-sm">{po.externalPoNumber}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{po.portal}</Badge>
                  </TableCell>
                  <TableCell>{po.vendorName ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Object.keys((po.requiredFields as Record<string, unknown>) ?? {}).length} fields
                  </TableCell>
                  <TableCell>
                    {latest ? (
                      <div className="flex flex-col gap-1">
                        <Badge variant={STATUS_VARIANT[latest.status]} className="w-fit">
                          {latest.status}
                        </Badge>
                        {latest.portalMessage && (
                          <span
                            className="max-w-56 truncate text-xs text-muted-foreground"
                            title={latest.portalMessage}
                          >
                            {latest.portalMessage}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not submitted</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => setActiveOrder(po)}>
                      Submit invoice
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <SubmitInvoiceDialog
        purchaseOrder={activeOrder}
        onOpenChange={(open) => !open && setActiveOrder(null)}
      />
    </div>
  );
}
