import { createClient } from "@/lib/supabase/server";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { getVendor, getVendorUser } from "@/lib/vendor";

export default async function POSPage() {
  const vendor = await getVendor();
  const vendorUser = await getVendorUser();
  const supabase = await createClient();

  const [
    { data: products },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("is_active", true)
      .is("deleted_at", null),
    supabase
      .from("categories")
      .select("*")
      .eq("vendor_id", vendor.id),
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
    <POSTerminal 
      products={mappedProducts as any} 
      categories={mappedCategories as any} 
      vendor={vendor as any} 
      cashierId={vendorUser?.id ?? ""} 
    />
  );
}
