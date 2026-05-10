"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const vendor = await getVendor();
  const parsed = categorySchema.parse(data);
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      name: parsed.name,
      color: parsed.color,
      vendor_id: vendor.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/categories");
  return category;
}

export async function updateCategory(id: string, data: Partial<z.infer<typeof categorySchema>>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .update({
      name: data.name,
      color: data.color,
    })
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/categories");
  return category;
}

export async function deleteCategory(id: string) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error(error.message);

  revalidatePath("/categories");
  return { success: true };
}
