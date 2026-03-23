import { getDb, products, categories } from "@/db";
import { eq, desc } from "drizzle-orm";
import { ProductsClient } from "@/components/products/products-client";
import { getVendor } from "@/lib/vendor";

export default async function ProductsPage() {
  const vendor = await getVendor();
  const db = getDb();
  const [data, cats] = await Promise.all([
    db.select().from(products).where(eq(products.vendorId, vendor.id)).orderBy(desc(products.createdAt)),
    db.select().from(categories).where(eq(categories.vendorId, vendor.id)),
  ]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Products</h1><p className="text-muted-foreground text-sm mt-1">Manage your product catalogue</p></div>
      <ProductsClient products={data} categories={cats} vendorId={vendor.id} />
    </div>
  );
}
