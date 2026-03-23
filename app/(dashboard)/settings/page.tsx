import { getDb, vendorSettings } from "@/db";
import { eq } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const vendor = await getVendor();
  const db = getDb();
  const rows = await db.select().from(vendorSettings).where(eq(vendorSettings.vendorId, vendor.id));
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Settings</h1><p className="text-muted-foreground text-sm mt-1">Configure your store</p></div>
      <SettingsClient vendor={vendor} settings={settings} />
    </div>
  );
}
