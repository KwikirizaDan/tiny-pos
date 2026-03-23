import { getDb, auditLogs } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { AuditClient } from "@/components/audit/audit-client";

export default async function AuditPage() {
  const vendor = await getVendor();
  const db = getDb();
  const data = await db.select().from(auditLogs).where(eq(auditLogs.vendorId, vendor.id)).orderBy(desc(auditLogs.createdAt)).limit(200);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Audit Logs</h1><p className="text-muted-foreground text-sm mt-1">Security trail</p></div>
      <AuditClient logs={data} />
    </div>
  );
}
