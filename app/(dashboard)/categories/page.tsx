import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const vendor = await getVendor();
  const supabase = await createClient();
  
  const [
    { data: categories },
    { data: productCats }
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('vendor_id', vendor.id),
    supabase.from('products').select('category_id').eq('vendor_id', vendor.id),
  ]);

  const countMap: Record<string, number> = {};
  (productCats || []).forEach(p => {
    if (p.category_id) {
      countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    }
  });

  const mappedCategories = (categories || []).map(c => ({
    id: c.id,
    vendorId: c.vendor_id,
    name: c.name,
    color: c.color,
    createdAt: c.created_at
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Categories</h1><p className="text-muted-foreground text-sm mt-1">Organise your products</p></div>
      <CategoriesClient categories={mappedCategories as any} productCounts={countMap} />
    </div>
  );
}
