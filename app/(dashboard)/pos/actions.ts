"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, sales, saleItems, products, customers, users } from "@/db";
import { eq, sql, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const saleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  discountId: z.string().uuid().optional().nullable(),
  subtotal: z.string(),
  discountAmount: z.string().optional(),
  taxAmount: z.string().optional(),
  totalAmount: z.string(),
  paymentMethod: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.string(),
    subtotal: z.string(),
  })),
});

export async function createOrder(data: z.infer<typeof saleSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = saleSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, userId));
  const cashierId = user?.id ?? null;

  const sale = await db.transaction(async (tx) => {
    const [newSale] = await tx
      .insert(sales)
      .values({
        vendorId,
        cashierId,
        customerId: parsed.data.customerId,
        discountId: parsed.data.discountId,
        subtotal: parsed.data.subtotal,
        discountAmount: parsed.data.discountAmount,
        taxAmount: parsed.data.taxAmount,
        totalAmount: parsed.data.totalAmount,
        paymentMethod: parsed.data.paymentMethod,
        status: "completed",
      })
      .returning();

    for (const item of parsed.data.items) {
      await tx.insert(saleItems).values({
        saleId: newSale.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      });

      // Update stock
      await tx
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
        .where(and(eq(products.id, item.productId), eq(products.vendorId, vendorId)));
    }

    if (parsed.data.customerId) {
      // Update customer total spent
      await tx
        .update(customers)
        .set({
          totalSpent: sql`${customers.totalSpent} + ${parsed.data.totalAmount}`,
          loyaltyPoints: sql`${customers.loyaltyPoints} + ${Math.floor(Number(parsed.data.totalAmount) / 1000)}`
        })
        .where(and(eq(customers.id, parsed.data.customerId), eq(customers.vendorId, vendorId)));
    }

    return newSale;
  });

  revalidatePath("/orders");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/customers");
  return sale;
}
