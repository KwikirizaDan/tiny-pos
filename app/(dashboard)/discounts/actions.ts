"use server";

import { revalidatePath } from "next/cache";
import { getDb, discounts } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const discountSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().nullable(),
  discountType: z.enum(["percentage", "flat"]),
  value: z.string().min(1, "Value is required"),
  minOrderAmount: z.string().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function createDiscount(data: z.infer<typeof discountSchema>) {
  const vendor = await getVendor();
  const parsed = discountSchema.parse(data);

  const db = getDb();
  const [discount] = await db
    .insert(discounts)
    .values({
      ...parsed,
      vendorId: vendor.id,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    })
    .returning();

  revalidatePath("/discounts");
  return discount;
}

export async function updateDiscount(id: string, data: Partial<z.infer<typeof discountSchema>>) {
  const vendor = await getVendor();
  const db = getDb();

  const [discount] = await db
    .update(discounts)
    .set({
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    })
    .where(and(eq(discounts.id, id), eq(discounts.vendorId, vendor.id)))
    .returning();

  if (!discount) throw new Error("Discount not found");

  revalidatePath("/discounts");
  return discount;
}

export async function deleteDiscount(id: string) {
  const vendor = await getVendor();
  const db = getDb();

  await db
    .delete(discounts)
    .where(and(eq(discounts.id, id), eq(discounts.vendorId, vendor.id)));

  revalidatePath("/discounts");
  return { success: true };
}
