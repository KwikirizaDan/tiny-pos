import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/types/pos";

export async function requireRole(permission: Permission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("auth_id", user.id)
    .single();

  let role: UserRole;

  if (!profile) {
    // No staff profile — check if they own a vendor (i.e. they are the owner)
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!vendor) redirect("/sign-in");
    role = "owner";
  } else {
    if (!profile.is_active) redirect("/dashboard");
    role = profile.role as UserRole;
  }

  if (!can(role, permission)) {
    redirect("/dashboard");
  }

  return { role };
}
