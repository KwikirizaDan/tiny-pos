import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/require-role";
import { getVendor } from "@/lib/vendor";
import { AuditClient } from "@/components/audit/audit-client";

export default async function AuditPage() {
  await requireRole("audit.view");
  const vendor = await getVendor();
  const supabase = await createClient();
  
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const mappedLogs = (logs || []).map(l => ({
    id: l.id,
    vendorId: l.vendor_id,
    userId: l.user_id,
    action: l.action,
    tableName: l.table_name,
    recordId: l.record_id,
    oldData: l.old_data,
    newData: l.new_data,
    ipAddress: l.ip_address,
    createdAt: l.created_at
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Audit Logs</h1><p className="text-muted-foreground text-sm mt-1">Security trail</p></div>
      <AuditClient logs={mappedLogs as any} />
    </div>
  );
}
