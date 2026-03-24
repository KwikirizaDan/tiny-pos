"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, discounts } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const discountSchema = z.object({
  code: z.string().min(1).optional().nullable(),
  description: z.string().optional().nullable(),
  discountType: z.enum(["percentage", "flat"]),
  value: z.string(),
  minOrderAmount: z.string().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function createDiscount(data: z.infer<typeof discountSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = discountSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [discount] = await db
    .insert(discounts)
    .values({
      ...parsed.data,
      vendorId,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    })
    .returning();

  revalidatePath("/discounts");
  return discount;
}

export async function updateDiscount(id: string, data: z.infer<typeof discountSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = discountSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [discount] = await db
    .update(discounts)
    .set({
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    })
    .where(and(eq(discounts.id, id), eq(discounts.vendorId, vendorId)))
    .returning();

  if (!discount) throw new Error("Discount not found");

  revalidatePath("/discounts");
  return discount;
}

export async function deleteDiscount(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  await db
    .delete(discounts)
    .where(and(eq(discounts.id, id), eq(discounts.vendorId, vendorId)));

  revalidatePath("/discounts");
}
