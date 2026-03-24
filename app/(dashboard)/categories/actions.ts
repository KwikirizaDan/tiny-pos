"use server";

import { revalidatePath } from "next/cache";
import { getDb, categories } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const vendor = await getVendor();
  const parsed = categorySchema.parse(data);

  const db = getDb();
  const [category] = await db
    .insert(categories)
    .values({
      ...parsed,
      vendorId: vendor.id,
    })
    .returning();

  revalidatePath("/categories");
  return category;
}

export async function updateCategory(id: string, data: Partial<z.infer<typeof categorySchema>>) {
  const vendor = await getVendor();
  const db = getDb();

  const [category] = await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.vendorId, vendor.id)))
    .returning();

  if (!category) throw new Error("Category not found");

  revalidatePath("/categories");
  return category;
}

export async function deleteCategory(id: string) {
  const vendor = await getVendor();
  const db = getDb();

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.vendorId, vendor.id)));

  revalidatePath("/categories");
  return { success: true };
}
