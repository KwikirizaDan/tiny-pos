"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const staffSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["owner", "manager", "cashier"]),
  isActive: z.boolean().optional(),
});

export async function createStaff(data: z.infer<typeof staffSchema>) {
  const vendor = await getVendor();
  const parsed = staffSchema.parse(data);
  const supabase = await createClient();

  // Check if user already exists in this vendor
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.email)
    .eq("vendor_id", vendor.id)
    .single();

  if (existing) throw new Error("A user with this email already exists in your team.");

  const { data: staff, error } = await supabase
    .from("users")
    .insert({
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      vendor_id: vendor.id,
      auth_id: crypto.randomUUID(), // This is a placeholder until they link via Auth
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/staff");
  return staff;
}

export async function updateStaff(id: string, data: Partial<z.infer<typeof staffSchema>>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.email !== undefined) updateData.email = data.email;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: staff, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/staff");
  return staff;
}

export async function deleteStaff(id: string) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error(error.message);

  revalidatePath("/staff");
  return { success: true };
}
