import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/require-role";
import { getVendor, getVendorUser } from "@/lib/vendor";
import { StaffClient } from "@/components/staff/staff-client";

export default async function StaffPage() {
  await requireRole("staff.view");
  const [vendor, currentUser] = await Promise.all([getVendor(), getVendorUser()]);
  const supabase = await createClient();

  const { data: staffRows } = await supabase
    .from("users")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const mappedStaff = (staffRows || []).map(u => ({
    id: u.id,
    authId: u.auth_id,
    vendorId: u.vendor_id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.is_active,
    isSuperAdmin: u.is_super_admin,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Staff</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your team and their access levels</p>
      </div>
      <StaffClient staff={mappedStaff as any} currentUserRole={currentUser?.role ?? "owner"} />
    </div>
  );
}
