import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { CustomersClient } from "@/components/customers/customers-client";

export default async function CustomersPage() {
  const vendor = await getVendor();
  const supabase = await createClient();
  
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const mappedCustomers = (customers || []).map(c => ({
    id: c.id,
    vendorId: c.vendor_id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    loyaltyPoints: c.loyalty_points,
    totalSpent: Number(c.total_spent),
    notes: c.notes,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Customers</h1><p className="text-muted-foreground text-sm mt-1">Manage customer profiles</p></div>
      <CustomersClient customers={mappedCustomers as any} />
    </div>
  );
}
