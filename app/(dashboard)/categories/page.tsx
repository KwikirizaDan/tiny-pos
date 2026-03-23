import { getDb, categories, products } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const vendor = await getVendor();
  const db = getDb();
  const [data, counts] = await Promise.all([
    db.select().from(categories).where(eq(categories.vendorId, vendor.id)),
    db.select({ categoryId: products.categoryId, count: sql<number>`count(*)`.mapWith(Number) }).from(products).where(eq(products.vendorId, vendor.id)).groupBy(products.categoryId),
  ]);
  const countMap = Object.fromEntries(counts.map(c => [c.categoryId, c.count]));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Categories</h1><p className="text-muted-foreground text-sm mt-1">Organise your products</p></div>
      <CategoriesClient categories={data} productCounts={countMap} />
    </div>
  );
}
