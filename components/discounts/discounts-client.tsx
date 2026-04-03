"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DiscountDialog } from "./discount-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Discount } from "@/db/schema";

export function DiscountsClient({ discounts: init }: { discounts: Discount[] }) {
  const [discounts, setDiscounts] = useState(init);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Discount | null>(null);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    if (res.ok) { setDiscounts((p) => p.filter((d) => d.id !== id)); toast.success("Discount deleted"); }
    else toast.error("Failed to delete");
  };

  const handleToggle = async (discount: Discount) => {
    const res = await fetch(`/api/discounts/${discount.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !discount.isActive }) });
    if (res.ok) {
      const updated = await res.json();
      setDiscounts((p) => p.map((d) => d.id === updated.id ? updated : d));
      toast.success(`Discount ${updated.isActive ? "activated" : "deactivated"}`);
    }
  };

  const handleSave = (discount: Discount) => {
    setDiscounts((prev) => {
      const idx = prev.findIndex((d) => d.id === discount.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = discount; return next; }
      return [discount, ...prev];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{discounts.length} discounts</p>
        <Button size="sm" onClick={() => { setEditDiscount(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add discount</Button>
      </div>

      {discounts.length === 0 ? (
        <div className="border p-12 text-center">
          <Tag className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No discounts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {discounts.map((d) => (
            <div key={d.id} className="border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">{d.code}</span>
                    <Badge variant={d.isActive ? "success" : "secondary"} className="text-[10px]">
                      {d.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(d)}>
                    {d.isActive ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditDiscount(d); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(d)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{d.discountType}</p></div>
                <div><span className="text-muted-foreground">Value</span><p className="font-medium">{d.discountType === "percentage" ? `${d.value}%` : formatCurrency(d.value)}</p></div>
                <div><span className="text-muted-foreground">Uses</span><p className="font-medium">{d.usesCount ?? 0}{d.maxUses ? ` / ${d.maxUses}` : ""}</p></div>
                <div><span className="text-muted-foreground">Expires</span><p className="font-medium">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "Never"}</p></div>
              </div>
              {d.minOrderAmount && (
                <p className="text-[10px] text-muted-foreground">Min order: {formatCurrency(d.minOrderAmount)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <DiscountDialog open={dialogOpen} onOpenChange={setDialogOpen} discount={editDiscount} onSave={handleSave} />

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete discount "{confirmDelete?.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>No</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) handleDelete(confirmDelete.id); setConfirmDelete(null); }}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
