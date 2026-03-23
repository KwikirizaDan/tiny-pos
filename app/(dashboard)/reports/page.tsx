import { getVendor } from "@/lib/vendor";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
  const vendor = await getVendor();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Reports</h1><p className="text-muted-foreground text-sm mt-1">Sales analytics and exports</p></div>
      <ReportsClient vendorName={vendor.name} />
    </div>
  );
}
