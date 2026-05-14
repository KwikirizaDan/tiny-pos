import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function tryResolveVendor(supabase: any, authId: string) {
  // First: user has a profile in the users table (staff or owner)
  const { data: profile } = await supabase
    .from('users')
    .select('vendor_id')
    .eq('auth_id', authId)
    .maybeSingle();

  if (profile?.vendor_id) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', profile.vendor_id)
      .single();
    if (vendor) return vendor;
  }

  // Fallback: user is the vendor owner (no users row yet)
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', authId)
    .single();

  return vendor ?? null;
}

export async function getVendor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const vendor = await tryResolveVendor(supabase, user.id);
  if (!vendor) redirect("/onboarding")
  return vendor;
}

export async function getVendorId(authId: string): Promise<string | null> {
  const supabase = await createClient();
  const vendor = await tryResolveVendor(supabase, authId);
  return vendor?.id ?? null;
}

export async function resolveVendor(supabase: any, authId: string) {
  return tryResolveVendor(supabase, authId);
}

export async function getVendorUser() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (user) return user;

  // No staff profile — check if they own a vendor; if so treat them as owner
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', authUser.id)
    .single();

  if (!vendor) return null;
  return { role: 'owner', is_active: true } as any;
}
