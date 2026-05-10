"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.string().min(1, "Price is required"),
  costPrice: z.string().optional().nullable(),
  stockQuantity: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  const vendor = await getVendor();
  const parsed = productSchema.parse(data);
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: parsed.name,
      description: parsed.description,
      price: parsed.price,
      cost_price: parsed.costPrice,
      stock_quantity: parsed.stockQuantity,
      low_stock_alert: parsed.lowStockAlert,
      category_id: parsed.categoryId,
      sku: parsed.sku,
      image_url: parsed.imageUrl,
      is_active: parsed.isActive ?? true,
      vendor_id: vendor.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  return product;
}

export async function updateProduct(id: string, data: Partial<z.infer<typeof productSchema>>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
  if (data.stockQuantity !== undefined) updateData.stock_quantity = data.stockQuantity;
  if (data.lowStockAlert !== undefined) updateData.low_stock_alert = data.lowStockAlert;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: product, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  return product;
}

export async function deleteProduct(id: string) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  return { success: true };
}
