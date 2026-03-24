"use server";

import { revalidatePath } from "next/cache";
import { getDb, sales, saleItems, products } from "@/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const orderSchema = z.object({
  cashierId: z.string().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.string()
  })),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

export async function createOrder(data: z.infer<typeof orderSchema>) {
  const vendor = await getVendor();
  const parsed = orderSchema.parse(data);

  const db = getDb();
  const { items, cashierId, customerId, paymentMethod, notes } = parsed;

  // SECURITY FIX: Verify all products belong to this vendor and get real prices
  const dbProducts = await db.select().from(products)
    .where(and(inArray(products.id, items.map(i => i.productId)), eq(products.vendorId, vendor.id)));

  if (dbProducts.length !== items.length) throw new Error("One or more products not found");

  // SECURITY FIX: Calculate totals server-side from real DB prices
  const subtotal = items.reduce((sum, item) => {
    const p = dbProducts.find(p => p.id === item.productId)!;
    return sum + Number(p.price) * item.quantity;
  }, 0);
  const totalAmount = subtotal;

  try {
    const sale = await db.transaction(async (tx) => {
      const [sale] = await tx.insert(sales).values({
        vendorId: vendor.id,
        cashierId: cashierId ?? null,
        customerId: customerId ?? null,
        subtotal: subtotal.toFixed(2),
        taxAmount: "0",
        discountAmount: "0",
        totalAmount: totalAmount.toFixed(2),
        paymentMethod,
        notes: notes ?? null,
        status: "completed",
      }).returning();

      await tx.insert(saleItems).values(items.map(item => {
        const p = dbProducts.find(p => p.id === item.productId)!;
        return {
          saleId: sale.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: p.price,
          subtotal: (Number(p.price) * item.quantity).toFixed(2)
        };
      }));

      for (const item of items) {
        await tx.update(products).set({
          stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date()
        }).where(and(eq(products.id, item.productId), eq(products.vendorId, vendor.id)));
      }

      return sale;
    });

    revalidatePath("/orders");
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return sale;
  } catch (error: any) {
    console.error("Order error:", error);
    throw new Error(error.message ?? "Something went wrong. Please try again.");
  }
}
