import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { QRCodesClient } from "@/components/qr/qr-codes-client";

export default async function QRCodesPage() {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("is_active", true)
    .is("deleted_at", null);

  const mappedProducts = (products || []).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price)
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">QR Codes</h1><p className="text-muted-foreground text-sm mt-1">Generate and print QR codes</p></div>
      <QRCodesClient products={mappedProducts as any} storeName={vendor.name} />
    </div>
  );
}
