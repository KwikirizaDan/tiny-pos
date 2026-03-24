import { getVendor } from "@/lib/vendor";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user has a vendor, otherwise they get redirected to onboarding
  await getVendor();

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
