import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/require-role";
import { getVendor } from "@/lib/vendor";
import { DiscountsClient } from "@/components/discounts/discounts-client";

export default async function DiscountsPage() {
  await requireRole("discounts.manage");
  const vendor = await getVendor();
  const supabase = await createClient();
  
  const { data: discountRows } = await supabase
    .from("discounts")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const mappedDiscounts = (discountRows || []).map(d => ({
    id: d.id,
    vendorId: d.vendor_id,
    code: d.code,
    description: d.description,
    discountType: d.discount_type,
    value: Number(d.value),
    minOrderAmount: d.min_order_amount ? Number(d.min_order_amount) : null,
    maxUses: d.max_uses,
    usesCount: d.uses_count,
    expiresAt: d.expires_at,
    isActive: d.is_active,
    createdAt: d.created_at
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Discounts</h1><p className="text-muted-foreground text-sm mt-1">Manage promo codes</p></div>
      <DiscountsClient discounts={mappedDiscounts as any} />
    </div>
  );
}
