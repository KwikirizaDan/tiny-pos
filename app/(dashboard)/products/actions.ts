"use server";

import { revalidatePath } from "next/cache";
import { getDb, products } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  costPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  const vendor = await getVendor();
  const parsed = productSchema.parse(data);

  const db = getDb();
  const [product] = await db
    .insert(products)
    .values({
      ...parsed,
      vendorId: vendor.id,
    })
    .returning();

  revalidatePath("/products");
  return product;
}

export async function updateProduct(id: string, data: Partial<z.infer<typeof productSchema>>) {
  const vendor = await getVendor();
  const db = getDb();

  const [product] = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.vendorId, vendor.id)))
    .returning();

  if (!product) throw new Error("Product not found");

  revalidatePath("/products");
  return product;
}

export async function deleteProduct(id: string) {
  const vendor = await getVendor();
  const db = getDb();

  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.vendorId, vendor.id)));

  revalidatePath("/products");
  return { success: true };
}
