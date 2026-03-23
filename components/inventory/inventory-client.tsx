"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { InventoryLog, Product } from "@/db/schema";

const changeTypeVariant: Record<string, "success" | "destructive" | "secondary" | "warning"> = {
  restock: "success", sale: "secondary", refund: "warning", adjustment: "secondary", damage: "destructive",
};

export function InventoryClient({ logs: init, products }: { logs: InventoryLog[]; products: Product[] }) {
  const [logs, setLogs] = useState(init);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productId: "", changeType: "restock", quantityChange: "", notes: "" });

  const getProductName = (id: string | null) => products.find((p) => p.id === id)?.name ?? "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantityChange: Number(form.quantityChange) }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed"); }
      const saved = await res.json();
      setLogs((p) => [saved, ...p]);
      toast.success("Stock adjusted");
      setDialogOpen(false);
      setForm({ productId: "", changeType: "restock", quantityChange: "", notes: "" });
    } catch (e: any) { toast.error(e.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{logs.length} log entries</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Manual adjustment</Button>
      </div>

      {logs.length === 0 ? (
        <div className="border p-12 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No inventory changes yet</p>
        </div>
      ) : (
        <div className="border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Product</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Before</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Change</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">After</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(log.createdAt!)}</TableCell>
                  <TableCell className="text-sm font-medium">{getProductName(log.productId)}</TableCell>
                  <TableCell><Badge variant={changeTypeVariant[log.changeType] ?? "secondary"} className="capitalize text-[10px]">{log.changeType}</Badge></TableCell>
                  <TableCell className="text-sm">{log.quantityBefore}</TableCell>
                  <TableCell className={`text-sm font-medium ${log.quantityChange > 0 ? "text-emerald-500" : "text-red-500"}`}>{log.quantityChange > 0 ? "+" : ""}{log.quantityChange}</TableCell>
                  <TableCell className="text-sm font-medium">{log.quantityAfter}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Manual stock adjustment</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product *</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.changeType} onValueChange={(v) => setForm({ ...form, changeType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Quantity change *</Label><Input type="number" value={form.quantityChange} onChange={(e) => setForm({ ...form, quantityChange: e.target.value })} placeholder="e.g. +50 or -5" required /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional reason" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save adjustment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
