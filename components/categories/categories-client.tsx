"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CategoryDialog } from "./category-dialog";
import type { Category } from "@/types/pos";

const PRESET_COLORS = ["#7c3aed","#ea6c10","#16a34a","#dc2626","#2563eb","#db2777","#d97706","#0891b2"];

export function CategoriesClient({ categories: init, productCounts }: { categories: Category[]; productCounts: Record<string, number> }) {
  const [categories, setCategories] = useState(init);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) { setCategories(p => p.filter(c => c.id !== id)); toast.success("Category deleted"); }
    else toast.error("Failed to delete");
  };

  const handleSave = (cat: Category) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = cat; return next; }
      return [cat, ...prev];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        <Button size="sm" onClick={() => { setEditCategory(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add category</Button>
      </div>
      {categories.length === 0 ? (
        <div className="border p-12 text-center"><Tag className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" /><p className="text-sm text-muted-foreground">No categories yet</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="border bg-card p-4 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 shrink-0" style={{ background: cat.color ?? "#71717a" }} />
                <div className="min-w-0"><p className="font-medium text-sm truncate">{cat.name}</p><p className="text-xs text-muted-foreground">{productCounts[cat.id] ?? 0} products</p></div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setEditCategory(cat); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(cat)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editCategory} onSave={handleSave} presetColors={PRESET_COLORS} />

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete category "{confirmDelete?.name}"? This action cannot be undone.
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
