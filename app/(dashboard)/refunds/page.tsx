import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/require-role";
import { getVendor } from "@/lib/vendor";
import { RefundsClient } from "@/components/refunds/refunds-client";

export default async function RefundsPage() {
  await requireRole("orders.refund");
  const vendor = await getVendor();
  const supabase = await createClient();

  const [
    { data: refunds },
    { data: sales }
  ] = await Promise.all([
    supabase
      .from("refunds")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const mappedRefunds = (refunds || []).map(r => ({
    id: r.id,
    saleId: r.sale_id,
    vendorId: r.vendor_id,
    cashierId: r.cashier_id,
    amount: Number(r.amount),
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at
  }));

  const mappedSales = (sales || []).map(s => ({
    id: s.id,
    totalAmount: Number(s.total_amount),
    createdAt: s.created_at
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Refunds</h1><p className="text-muted-foreground text-sm mt-1">Process and track refunds</p></div>
      <RefundsClient refunds={mappedRefunds as any} sales={mappedSales as any} />
    </div>
  );
}
