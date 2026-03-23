import { getDb, sales, vendorSettings } from "@/db";
import { eq, desc } from "drizzle-orm";
import { OrdersClient } from "@/components/orders/orders-client";
import { getVendor } from "@/lib/vendor";

export default async function OrdersPage() {
  const vendor = await getVendor();
  const db = getDb();
  const [data, settingsRows] = await Promise.all([
    db.select().from(sales).where(eq(sales.vendorId, vendor.id)).orderBy(desc(sales.createdAt)).limit(200),
    db.select().from(vendorSettings).where(eq(vendorSettings.vendorId, vendor.id)),
  ]);
  const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value ?? ""]));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Orders</h1><p className="text-muted-foreground text-sm mt-1">Transaction history</p></div>
      <OrdersClient orders={data} storeName={settings.receipt_header ?? vendor.name} storePhone="+256 707 265 240" receiptFooter={settings.receipt_footer} />
    </div>
  );
}
