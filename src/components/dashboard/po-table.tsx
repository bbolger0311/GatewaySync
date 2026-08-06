"use client";

import { useMemo, useState } from "react";
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
import { SubmitInvoiceDialog } from "./submit-invoice-dialog";
import type { PurchaseOrder } from "@/generated/prisma/client";

type Row = Pick<
  PurchaseOrder,
  "id" | "portal" | "externalPoNumber" | "vendorName" | "requiredFields"
>;

export function PurchaseOrderTable({ purchaseOrders }: { purchaseOrders: Row[] }) {
  const [filter, setFilter] = useState("");
  const [activeOrder, setActiveOrder] = useState<Row | null>(null);

  const filtered = useMemo(
    () =>
      purchaseOrders.filter((po) =>
        po.externalPoNumber.toLowerCase().includes(filter.trim().toLowerCase()),
      ),
    [purchaseOrders, filter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Filter by PO number"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" render={<a href="/api/export" />}>
          Export to Excel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Required fields</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No purchase orders yet — connect a portal above to sync open POs.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono text-sm">{po.externalPoNumber}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{po.portal}</Badge>
                </TableCell>
                <TableCell>{po.vendorName ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {Object.keys((po.requiredFields as Record<string, unknown>) ?? {}).length} fields
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => setActiveOrder(po)}>
                    Submit invoice
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
