import { createClient } from "@/lib/supabase/server";
import { OrdersClient } from "@/components/orders/orders-client";
import { getVendor } from "@/lib/vendor";

export default async function OrdersPage() {
  const vendor = await getVendor();
  const supabase = await createClient();

  const [
    { data: sales },
    { data: settingsRows }
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("vendor_settings")
      .select("*")
      .eq("vendor_id", vendor.id),
  ]);

  const mappedSales = (sales || []).map(s => ({
    id: s.id,
    vendorId: s.vendor_id,
    cashierId: s.cashier_id,
    customerId: s.customer_id,
    discountId: s.discount_id,
    subtotal: Number(s.subtotal),
    discountAmount: Number(s.discount_amount),
    taxAmount: Number(s.tax_amount),
    totalAmount: Number(s.total_amount),
    paymentMethod: s.payment_method,
    status: s.status,
    notes: s.notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  }));

  const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value ?? ""]));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Orders</h1><p className="text-muted-foreground text-sm mt-1">Transaction history</p></div>
      <OrdersClient 
        orders={mappedSales as any} 
        storeName={settings.receipt_header ?? vendor.name} 
        storePhone="+256 707 265 240" 
        receiptFooter={settings.receipt_footer} 
      />
    </div>
  );
}
