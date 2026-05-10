"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category } from "@/types/pos";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { uploadProductImage } from "@/lib/supabase/storage";
import { ImagePlus } from "lucide-react";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: "0",
    lowStockAlert: "5",
    categoryId: "none",
    sku: "",
    isActive: true,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        price: String(product.price),
        costPrice: product.costPrice ? String(product.costPrice) : "",
        stockQuantity: String(product.stockQuantity ?? 0),
        lowStockAlert: String(product.lowStockAlert ?? 5),
        categoryId: product.categoryId ?? "none",
        sku: product.sku ?? "",
        isActive: product.isActive ?? true,
      });
      setImagePreview(product.imageUrl);
    } else {
      setForm({ name: "", description: "", price: "", costPrice: "", stockQuantity: "0", lowStockAlert: "5", categoryId: "none", sku: "", isActive: true });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = product?.imageUrl || null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const payload = {
        ...form,
        stockQuantity: Number(form.stockQuantity),
        lowStockAlert: Number(form.lowStockAlert),
        categoryId: form.categoryId === "none" ? null : form.categoryId,
        costPrice: form.costPrice === "" ? null : form.costPrice,
        description: form.description || null,
        sku: form.sku || null,
        imageUrl,
      };

      const saved = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload as any);

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
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">Click to upload product image</p>
          </div>

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
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v ?? form.categoryId })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
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
