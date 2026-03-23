import { getDb, customers } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { CustomersClient } from "@/components/customers/customers-client";

export default async function CustomersPage() {
  const vendor = await getVendor();
  const db = getDb();
  const data = await db.select().from(customers).where(eq(customers.vendorId, vendor.id)).orderBy(desc(customers.createdAt));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Customers</h1><p className="text-muted-foreground text-sm mt-1">Manage customer profiles</p></div>
      <CustomersClient customers={data} />
    </div>
  );
}
