"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const discountSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().nullable(),
  discountType: z.enum(["percentage", "flat"]),
  value: z.string().min(1, "Value is required"),
  minOrderAmount: z.string().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function createDiscount(data: z.infer<typeof discountSchema>) {
  const vendor = await getVendor();
  const parsed = discountSchema.parse(data);
  const supabase = await createClient();

  const { data: discount, error } = await supabase
    .from("discounts")
    .insert({
      code: parsed.code,
      description: parsed.description,
      discount_type: parsed.discountType,
      value: parsed.value,
      min_order_amount: parsed.minOrderAmount,
      max_uses: parsed.maxUses,
      expires_at: parsed.expiresAt ? new Date(parsed.expiresAt).toISOString() : null,
      is_active: parsed.isActive ?? true,
      vendor_id: vendor.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/discounts");
  return discount;
}

export async function updateDiscount(id: string, data: Partial<z.infer<typeof discountSchema>>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const updateData: any = {};
  if (data.code !== undefined) updateData.code = data.code;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.discountType !== undefined) updateData.discount_type = data.discountType;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.minOrderAmount !== undefined) updateData.min_order_amount = data.minOrderAmount;
  if (data.maxUses !== undefined) updateData.max_uses = data.maxUses;
  if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt ? new Date(data.expiresAt).toISOString() : null;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: discount, error } = await supabase
    .from("discounts")
    .update(updateData)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/discounts");
  return discount;
}

export async function deleteDiscount(id: string) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("discounts")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error(error.message);

  revalidatePath("/discounts");
  return { success: true };
}
