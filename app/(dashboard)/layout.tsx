import { getVendor, getVendorUser } from "@/lib/vendor";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getVendor();
  const vendorUser = await getVendorUser();
  const userRole = (vendorUser?.role ?? "owner") as "owner" | "manager" | "cashier";

  return <DashboardLayoutClient userRole={userRole}>{children}</DashboardLayoutClient>;
}
