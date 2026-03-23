import { getDb, products, categories } from "@/db";
import { eq, and } from "drizzle-orm";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { getVendor, getVendorUser } from "@/lib/vendor";

export default async function POSPage() {
  const vendor = await getVendor();
  const vendorUser = await getVendorUser();
  const db = getDb();
  const [allProducts, cats] = await Promise.all([
    db.select().from(products).where(and(eq(products.vendorId, vendor.id), eq(products.isActive, true))),
    db.select().from(categories).where(eq(categories.vendorId, vendor.id)),
  ]);
  return <POSTerminal products={allProducts} categories={cats} vendor={vendor} cashierId={vendorUser?.id ?? ""} />;
}
