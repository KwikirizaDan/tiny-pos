import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/require-role";
import { getVendor } from "@/lib/vendor";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
  await requireRole("inventory.manage");
  const vendor = await getVendor();
  const supabase = await createClient();

  const [
    { data: logs },
    { data: prods }
  ] = await Promise.all([
    supabase
      .from("inventory_logs")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendor.id),
  ]);

  const mappedLogs = (logs || []).map(l => ({
    id: l.id,
    productId: l.product_id,
    vendorId: l.vendor_id,
    changeType: l.change_type,
    quantityBefore: l.quantity_before,
    quantityChange: l.quantity_change,
    quantityAfter: l.quantity_after,
    referenceId: l.reference_id,
    notes: l.notes,
    createdAt: l.created_at
  }));

  const mappedProducts = (prods || []).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Inventory Logs</h1><p className="text-muted-foreground text-sm mt-1">Full stock change history</p></div>
      <InventoryClient logs={mappedLogs as any} products={mappedProducts as any} />
    </div>
  );
}
