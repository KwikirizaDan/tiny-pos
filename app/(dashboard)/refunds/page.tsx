import { getDb, refunds, sales } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { RefundsClient } from "@/components/refunds/refunds-client";

export default async function RefundsPage() {
  const vendor = await getVendor();
  const db = getDb();
  const [data, salesData] = await Promise.all([
    db.select().from(refunds).where(eq(refunds.vendorId, vendor.id)).orderBy(desc(refunds.createdAt)),
    db.select().from(sales).where(eq(sales.vendorId, vendor.id)).orderBy(desc(sales.createdAt)).limit(100),
  ]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Refunds</h1><p className="text-muted-foreground text-sm mt-1">Process and track refunds</p></div>
      <RefundsClient refunds={data} sales={salesData} />
    </div>
  );
}
