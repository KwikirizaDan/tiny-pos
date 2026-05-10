import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { ProductsClient } from "@/components/products/products-client";

export default async function ProductsPage() {
  const vendor = await getVendor();
  const supabase = await createClient();

  const [
    { data: products },
    { data: categories }
  ] = await Promise.all([
    supabase.from('products').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('vendor_id', vendor.id),
  ]);

  const mappedProducts = (products || []).map(p => ({
    id: p.id,
    vendorId: p.vendor_id,
    categoryId: p.category_id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    price: Number(p.price),
    costPrice: p.cost_price ? Number(p.cost_price) : null,
    stockQuantity: p.stock_quantity,
    lowStockAlert: p.low_stock_alert,
    imageUrl: p.image_url,
    isActive: p.is_active,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));

  const mappedCategories = (categories || []).map(c => ({
    id: c.id,
    vendorId: c.vendor_id,
    name: c.name,
    color: c.color,
    createdAt: c.created_at
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Products</h1><p className="text-muted-foreground text-sm mt-1">Manage your product catalogue</p></div>
      <ProductsClient products={mappedProducts as any} categories={mappedCategories as any} vendorId={vendor.id} />
    </div>
  );
}
