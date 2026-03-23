import { getDb, inventoryLogs, products } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
  const vendor = await getVendor();
  const db = getDb();
  const [logs, prods] = await Promise.all([
    db.select().from(inventoryLogs).where(eq(inventoryLogs.vendorId, vendor.id)).orderBy(desc(inventoryLogs.createdAt)).limit(200),
    db.select().from(products).where(eq(products.vendorId, vendor.id)),
  ]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Inventory Logs</h1><p className="text-muted-foreground text-sm mt-1">Full stock change history</p></div>
      <InventoryClient logs={logs} products={prods} />
    </div>
  );
}
