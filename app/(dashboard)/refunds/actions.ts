"use server";

import { revalidatePath } from "next/cache";
import { getDb, refunds, sales } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const refundSchema = z.object({
  saleId: z.string().uuid(),
  amount: z.string().min(1, "Amount is required"),
  reason: z.string().optional().nullable(),
});

export async function createRefund(data: z.infer<typeof refundSchema>) {
  const vendor = await getVendor();
  const parsed = refundSchema.parse(data);

  const db = getDb();

  // Verify sale belongs to this vendor
  const [sale] = await db
    .select()
    .from(sales)
    .where(and(eq(sales.id, parsed.saleId), eq(sales.vendorId, vendor.id)));

  if (!sale) throw new Error("Sale not found");
  if (sale.status === "refunded") throw new Error("Already refunded");

  const refund = await db.transaction(async (tx) => {
    const [refund] = await tx
      .insert(refunds)
      .values({
        ...parsed,
        vendorId: vendor.id,
        status: "processed",
      })
      .returning();

    await tx
      .update(sales)
      .set({
        status: "refunded",
        updatedAt: new Date(),
      })
      .where(and(eq(sales.id, parsed.saleId), eq(sales.vendorId, vendor.id)));

    return refund;
  });

  revalidatePath("/refunds");
  revalidatePath("/orders");
  revalidatePath("/dashboard");

  return refund;
}
