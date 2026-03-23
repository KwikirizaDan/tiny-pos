"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Category } from "@/db/schema";
import { createCategory, updateCategory } from "@/app/(dashboard)/categories/actions";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; category: Category | null; onSave: (c: Category) => void; presetColors: string[]; }

export function CategoryDialog({ open, onOpenChange, category, onSave, presetColors }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#7c3aed" });

  useEffect(() => {
    if (category) setForm({ name: category.name, color: category.color ?? "#7c3aed" });
    else setForm({ name: "", color: "#7c3aed" });
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const saved = category
        ? await updateCategory(category.id, form)
        : await createCategory(form);
      onSave(saved as Category);
      toast.success(category ? "Category updated" : "Category created");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Beverages" required /></div>
          <div className="space-y-2">
            <Label>Colour</Label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map(color => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })} className="w-7 h-7 transition-transform hover:scale-110" style={{ background: color, outline: form.color === color ? `2px solid ${color}` : "none", outlineOffset: 2 }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-8 h-8 cursor-pointer border border-input" />
              <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
            </div>
          </div>
          <div className="border p-3 flex items-center gap-2"><div className="w-3 h-3" style={{ background: form.color }} /><span className="text-sm">{form.name || "Category name"}</span></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : category ? "Save changes" : "Add category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
