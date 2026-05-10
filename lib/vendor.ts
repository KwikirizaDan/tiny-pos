import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getVendor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', user.id)
    .single();
    
  if (!vendor) redirect("/onboarding")
  return vendor;
}

export async function getVendorId(authId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', authId)
    .single();
  return vendor?.id ?? null;
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
