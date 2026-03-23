import { getDb, discounts } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { DiscountsClient } from "@/components/discounts/discounts-client";

export default async function DiscountsPage() {
  const vendor = await getVendor();
  const db = getDb();
  const data = await db.select().from(discounts).where(eq(discounts.vendorId, vendor.id)).orderBy(desc(discounts.createdAt));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Discounts</h1><p className="text-muted-foreground text-sm mt-1">Manage promo codes</p></div>
      <DiscountsClient discounts={data} />
    </div>
  );
}
