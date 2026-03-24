"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, inventoryLogs, products } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const inventorySchema = z.object({
  productId: z.string().uuid(),
  changeType: z.enum(["restock", "adjustment", "damage", "sale", "refund"]),
  quantityChange: z.number().int(),
  notes: z.string().optional().nullable(),
});

export async function logInventoryChange(data: z.infer<typeof inventorySchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = inventorySchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();

  const log = await db.transaction(async (tx) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, parsed.data.productId), eq(products.vendorId, vendorId)));

    if (!product) throw new Error("Product not found");

    const quantityBefore = product.stockQuantity ?? 0;
    const quantityAfter = quantityBefore + parsed.data.quantityChange;

    const [newLog] = await tx
      .insert(inventoryLogs)
      .values({
        vendorId,
        productId: parsed.data.productId,
        changeType: parsed.data.changeType,
        quantityBefore,
        quantityChange: parsed.data.quantityChange,
        quantityAfter,
        notes: parsed.data.notes,
      })
      .returning();

    await tx
      .update(products)
      .set({ stockQuantity: quantityAfter, updatedAt: new Date() })
      .where(eq(products.id, parsed.data.productId));

    return newLog;
  });

  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return log;
}
