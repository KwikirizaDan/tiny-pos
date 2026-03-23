import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { StaffClient } from "@/components/staff/staff-client";

export default async function StaffPage() {
  const vendor = await getVendor();
  const db = getDb();
  const data = await db.select().from(users).where(eq(users.vendorId, vendor.id));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Staff</h1><p className="text-muted-foreground text-sm mt-1">Manage your team</p></div>
      <StaffClient staff={data} />
    </div>
  );
}
