"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefundDialog } from "./refund-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Refund, Sale } from "@/types/pos";

const statusVariant: Record<string, "success" | "warning" | "destructive"> = {
  processed: "success", pending: "warning", rejected: "destructive",
};

const PAGE_SIZE = 10;

export function RefundsClient({ refunds: init, sales }: { refunds: Refund[]; sales: Sale[] }) {
  const [refunds, setRefunds] = useState(init);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const pageCount = Math.ceil(refunds.length / PAGE_SIZE);
  const paginatedRefunds = refunds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSave = (refund: Refund) => setRefunds((p) => [refund, ...p]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{refunds.length} refunds</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Process refund</Button>
      </div>

      {refunds.length === 0 ? (
        <div className="border p-12 text-center">
          <RefreshCcw className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No refunds yet</p>
        </div>
      ) : (
        <div className="border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Sale ID</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Reason</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRefunds.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.createdAt!)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.saleId?.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="font-medium text-sm">{formatCurrency(Number(r.amount))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.reason ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status ?? "pending"]} className="capitalize text-[10px]">
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {refunds.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{refunds.length} refunds</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
            <span className="text-xs">Page {page + 1} of {pageCount}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>Next</Button>
          </div>
        </div>
      )}

      <RefundDialog open={dialogOpen} onOpenChange={setDialogOpen} sales={sales} onSave={handleSave} />
    </div>
  );
}
