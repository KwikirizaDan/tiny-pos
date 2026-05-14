"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Refund, Sale } from "@/types/pos";
import { createRefund } from "@/app/(dashboard)/refunds/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sales: Sale[];
  onSave: (refund: Refund) => void;
}

export function RefundDialog({ open, onOpenChange, sales, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ saleId: "", amount: "", reason: "" });

  const selectedSale = sales.find((s) => s.id === form.saleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await createRefund(form);
      onSave(saved as Refund);
      toast.success("Refund processed");
      onOpenChange(false);
      setForm({ saleId: "", amount: "", reason: "" });
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Process refund</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select sale *</Label>
            <Select value={form.saleId} onValueChange={(v) => { const s = sales.find((x) => x.id === v); setForm({ ...form, saleId: v ?? form.saleId, amount: s ? String(s.totalAmount) : "" }); }}>
              <SelectTrigger><SelectValue placeholder="Select a completed sale" /></SelectTrigger>
              <SelectContent>
                {sales.filter((s) => s.status === "completed").map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.id.slice(0, 8).toUpperCase()} · {formatCurrency(Number(s.totalAmount))} · {formatDate(s.createdAt!)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedSale && (
            <div className="border p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Sale total</span><span className="font-medium">{formatCurrency(Number(selectedSale.totalAmount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize">{selectedSale.paymentMethod}</span></div>
            </div>
          )}
          <div className="space-y-1.5"><Label>Refund amount (UGX) *</Label><Input type="number" min="0" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required /></div>
          <div className="space-y-1.5"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Customer returned item…" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.saleId}>{loading ? "Processing…" : "Process refund"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
