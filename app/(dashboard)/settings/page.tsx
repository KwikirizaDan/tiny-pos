import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/require-role";
import { getVendor } from "@/lib/vendor";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  await requireRole("settings.manage");
  const vendor = await getVendor();
  const supabase = await createClient();
  
  const { data: rows } = await supabase
    .from("vendor_settings")
    .select("*")
    .eq("vendor_id", vendor.id);

  const settings = Object.fromEntries((rows || []).map(r => [r.key, r.value ?? ""]));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-medium tracking-tight">Settings</h1><p className="text-muted-foreground text-sm mt-1">Configure your store</p></div>
      <SettingsClient vendor={vendor as any} settings={settings} />
    </div>
  );
}
