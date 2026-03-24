"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, refunds, sales, users } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const refundSchema = z.object({
  saleId: z.string().uuid(),
  amount: z.string(),
  reason: z.string().optional().nullable(),
});

export async function createRefund(data: z.infer<typeof refundSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = refundSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, userId));
  const cashierId = user?.id ?? null;

  const refund = await db.transaction(async (tx) => {
    const [sale] = await tx
      .select()
      .from(sales)
      .where(and(eq(sales.id, parsed.data.saleId), eq(sales.vendorId, vendorId)));

    if (!sale) throw new Error("Sale not found");

    const [newRefund] = await tx
      .insert(refunds)
      .values({
        vendorId,
        saleId: parsed.data.saleId,
        cashierId,
        amount: parsed.data.amount,
        reason: parsed.data.reason,
        status: "processed",
      })
      .returning();

    await tx
      .update(sales)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(sales.id, parsed.data.saleId));

    return newRefund;
  });

  revalidatePath("/refunds");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return refund;
}
