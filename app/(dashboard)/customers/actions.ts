"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  loyaltyPoints: z.number().int().min(0).optional(),
});

export async function createCustomer(data: z.infer<typeof customerSchema>) {
  const vendor = await getVendor();
  const parsed = customerSchema.parse(data);
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email,
      notes: parsed.notes,
      loyalty_points: parsed.loyaltyPoints,
      vendor_id: vendor.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: Partial<z.infer<typeof customerSchema>>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.loyaltyPoints !== undefined) updateData.loyalty_points = data.loyaltyPoints;

  const { data: customer, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  return { success: true };
}
