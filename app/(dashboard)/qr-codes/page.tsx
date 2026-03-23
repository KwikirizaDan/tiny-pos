import { getDb, products } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { QRCodesClient } from "@/components/qr/qr-codes-client";

export default async function QRCodesPage() {
  const vendor = await getVendor();
  const db = getDb();
  const data = await db.select().from(products).where(and(eq(products.vendorId, vendor.id), eq(products.isActive, true)));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">QR Codes</h1><p className="text-muted-foreground text-sm mt-1">Generate and print QR codes</p></div>
      <QRCodesClient products={data} storeName={vendor.name} />
    </div>
  );
}
