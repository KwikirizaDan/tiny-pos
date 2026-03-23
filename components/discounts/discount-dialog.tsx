"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Discount } from "@/db/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: Discount | null;
  onSave: (discount: Discount) => void;
}

export function DiscountDialog({ open, onOpenChange, discount, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", discountType: "percentage", value: "", minOrderAmount: "", maxUses: "", expiresAt: "" });

  useEffect(() => {
    if (discount) {
      setForm({
        code: discount.code ?? "",
        description: discount.description ?? "",
        discountType: discount.discountType,
        value: discount.value,
        minOrderAmount: discount.minOrderAmount ?? "",
        maxUses: discount.maxUses ? String(discount.maxUses) : "",
        expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().slice(0, 10) : "",
      });
    } else {
      setForm({ code: "", description: "", discountType: "percentage", value: "", minOrderAmount: "", maxUses: "", expiresAt: "" });
    }
  }, [discount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null, minOrderAmount: form.minOrderAmount || undefined };
      const res = discount
        ? await fetch(`/api/discounts/${discount.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed"); }
      const saved = await res.json();
      onSave(saved);
      toast.success(discount ? "Discount updated" : "Discount created");
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{discount ? "Edit discount" : "Add discount"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE10" required /></div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat (UGX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Value *</Label><Input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.discountType === "percentage" ? "10" : "5000"} required /></div>
            <div className="space-y-1.5"><Label>Min order (UGX)</Label><Input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="Optional" /></div>
            <div className="space-y-1.5"><Label>Max uses</Label><Input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Unlimited" /></div>
            <div className="space-y-1.5"><Label>Expires</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : discount ? "Save changes" : "Create discount"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
