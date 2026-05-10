import { createClient } from "@/lib/supabase/server";

export async function createDefaultVendor(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  // Check if vendor already exists
  const { data: existing } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', userId)
    .single();

  if (existing) return existing;

  // Create default vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      name: "My Store", // In Supabase user metadata might have name, but let's keep it simple
      slug: `store-${userId.slice(-8)}`,
      owner_id: userId,
    })
    .select()
    .single();

  if (vendorError) throw vendorError;

  // Create owner user record
  const { error: userError } = await supabase
    .from('users')
    .insert({
      auth_id: userId,
      vendor_id: vendor.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? null,
      role: "owner",
      is_active: true,
    });

  if (userError) throw userError;

  return vendor;
}
