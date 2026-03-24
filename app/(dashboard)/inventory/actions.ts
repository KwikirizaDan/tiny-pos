"use server";

import { revalidatePath } from "next/cache";
import { getDb, inventoryLogs, products } from "@/db";
import { eq, and } from "drizzle-orm";
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

  const db = getDb();

  // Verify product belongs to this vendor
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, parsed.productId), eq(products.vendorId, vendor.id)));

  if (!product) throw new Error("Product not found");

  const before = product.stockQuantity ?? 0;
  const after = before + parsed.quantityChange;

  const [log] = await db
    .insert(inventoryLogs)
    .values({
      ...parsed,
      vendorId: vendor.id,
      quantityBefore: before,
      quantityAfter: after,
    })
    .returning();

  await db
    .update(products)
    .set({
      stockQuantity: after,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, parsed.productId), eq(products.vendorId, vendor.id)));

  revalidatePath("/inventory");
  revalidatePath("/products");

  return log;
}
