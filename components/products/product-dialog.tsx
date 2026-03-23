"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category } from "@/db/schema";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  vendorId: string;
  onSave: (product: Product) => void;
}

export function ProductDialog({ open, onOpenChange, product, categories, vendorId, onSave }: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: "0",
    lowStockAlert: "5",
    categoryId: "",
    sku: "",
    isActive: true,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        costPrice: product.costPrice ?? "",
        stockQuantity: String(product.stockQuantity ?? 0),
        lowStockAlert: String(product.lowStockAlert ?? 5),
        categoryId: product.categoryId ?? "",
        sku: product.sku ?? "",
        isActive: product.isActive ?? true,
      });
    } else {
      setForm({ name: "", description: "", price: "", costPrice: "", stockQuantity: "0", lowStockAlert: "5", categoryId: "", sku: "", isActive: true });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        stockQuantity: Number(form.stockQuantity),
        lowStockAlert: Number(form.lowStockAlert),
        categoryId: form.categoryId || null,
        costPrice: form.costPrice || undefined,
      };

      const saved = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      onSave(saved as Product);
      toast.success(product ? "Product updated" : "Product created");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product name" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Selling price (UGX) *</Label>
              <Input id="price" type="number" step="1" min="0" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="5000" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costPrice">Cost price (UGX)</Label>
              <Input id="costPrice" type="number" step="1" min="0" value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="3000" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock quantity</Label>
              <Input id="stock" type="number" min="0" value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                placeholder="0" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lowStock">Low stock alert</Label>
              <Input id="lowStock" type="number" min="0" value={form.lowStockAlert}
                onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })}
                placeholder="5" />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU-001" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
