"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
});

export async function updateSetting(data: z.infer<typeof settingSchema>) {
  const vendor = await getVendor();
  const parsed = settingSchema.parse(data);
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("vendor_settings")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("key", parsed.key)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (existing) {
    const { error: updateError } = await supabase
      .from("vendor_settings")
      .update({
        value: parsed.value,
        updated_at: new Date().toISOString(),
      })
      .eq("vendor_id", vendor.id)
      .eq("key", parsed.key);
      
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await supabase
      .from("vendor_settings")
      .insert({
        vendor_id: vendor.id,
        key: parsed.key,
        value: parsed.value,
      });
      
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateMultipleSettings(settings: Record<string, string>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  for (const [key, value] of Object.entries(settings)) {
    const { data: existing, error: fetchError } = await supabase
      .from("vendor_settings")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("key", key)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);

    if (existing) {
      await supabase
        .from("vendor_settings")
        .update({
          value,
          updated_at: new Date().toISOString(),
        })
        .eq("vendor_id", vendor.id)
        .eq("key", key);
    } else {
      await supabase
        .from("vendor_settings")
        .insert({
          vendor_id: vendor.id,
          key,
          value,
        });
    }
  }

  revalidatePath("/settings");
  return { success: true };
}
