import { getDb, products, categories } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor, getVendorUser } from "@/lib/vendor";
import { ScanPOS } from "@/components/scan/scan-pos";

export default async function ScanPage() {
  const vendor = await getVendor();
  const vendorUser = await getVendorUser();
  const db = getDb();
  const [allProducts, cats] = await Promise.all([
    db.select().from(products).where(and(eq(products.vendorId, vendor.id), eq(products.isActive, true))),
    db.select().from(categories).where(eq(categories.vendorId, vendor.id)),
  ]);
  return <ScanPOS products={allProducts} categories={cats} vendor={vendor} cashierId={vendorUser?.id ?? ""} />;
}
