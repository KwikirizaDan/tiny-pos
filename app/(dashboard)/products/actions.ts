"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { logAuditEvent } from "@/lib/audit";
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

function mapProduct(p: any) {
  return {
    id: p.id,
    vendorId: p.vendor_id,
    categoryId: p.category_id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    price: Number(p.price),
    costPrice: p.cost_price ? Number(p.cost_price) : null,
    stockQuantity: p.stock_quantity,
    lowStockAlert: p.low_stock_alert,
    imageUrl: p.image_url,
    isActive: p.is_active,
    deletedAt: p.deleted_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

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
  revalidatePath("/dashboard");
  logAuditEvent({ action: "CREATE", tableName: "products", recordId: product.id, newData: JSON.stringify(product) });
  return mapProduct(product);
}

export async function updateProduct(id: string, data: Partial<z.infer<typeof productSchema>>) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { data: oldProduct } = await supabase.from("products").select("*").eq("id", id).single();

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
  revalidatePath("/dashboard");
  logAuditEvent({ action: "UPDATE", tableName: "products", recordId: id, oldData: JSON.stringify(oldProduct), newData: JSON.stringify(product) });
  return mapProduct(product);
}

export async function deleteProduct(id: string) {
  const vendor = await getVendor();
  const supabase = await createClient();

  const { data: oldProduct } = await supabase.from("products").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  logAuditEvent({ action: "DELETE", tableName: "products", recordId: id, oldData: JSON.stringify(oldProduct) });
  return { success: true };
}
