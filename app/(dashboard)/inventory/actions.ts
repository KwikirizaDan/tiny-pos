"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const inventoryLogSchema = z.object({
  productId: z.string().uuid(),
  changeType: z.enum(["sale", "refund", "restock", "adjustment", "damage"]),
  quantityChange: z.number().int(),
  notes: z.string().optional().nullable(),
});

export async function createInventoryLog(data: z.infer<typeof inventoryLogSchema>) {
  const vendor = await getVendor();
  const parsed = inventoryLogSchema.parse(data);
  const supabase = await createClient();

  // Verify product belongs to this vendor
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", parsed.productId)
    .eq("vendor_id", vendor.id)
    .single();

  if (productError || !product) throw new Error("Product not found");

  const before = product.stock_quantity ?? 0;
  const after = before + parsed.quantityChange;

  const { data: log, error: logError } = await supabase
    .from("inventory_logs")
    .insert({
      product_id: parsed.productId,
      change_type: parsed.changeType,
      quantity_change: parsed.quantityChange,
      notes: parsed.notes,
      vendor_id: vendor.id,
      quantity_before: before,
      quantity_after: after,
    })
    .select()
    .single();

  if (logError) throw new Error(logError.message);

  const { error: updateError } = await supabase
    .from("products")
    .update({
      stock_quantity: after,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.productId)
    .eq("vendor_id", vendor.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/inventory");
  revalidatePath("/products");

  return log;
}
