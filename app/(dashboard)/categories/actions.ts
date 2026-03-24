"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, categories } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [category] = await db
    .insert(categories)
    .values({ ...parsed.data, vendorId })
    .returning();

  revalidatePath("/categories");
  revalidatePath("/products");
  return category;
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [category] = await db
    .update(categories)
    .set(parsed.data)
    .where(and(eq(categories.id, id), eq(categories.vendorId, vendorId)))
    .returning();

  if (!category) throw new Error("Category not found");

  revalidatePath("/categories");
  revalidatePath("/products");
  return category;
}

export async function deleteCategory(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.vendorId, vendorId)));

  revalidatePath("/categories");
  revalidatePath("/products");
}
