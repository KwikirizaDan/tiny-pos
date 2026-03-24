"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, products } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().min(1),
  costPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [product] = await db
    .insert(products)
    .values({ ...parsed.data, vendorId })
    .returning();

  revalidatePath("/products");
  return product;
}

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [product] = await db
    .update(products)
    .set(parsed.data)
    .where(and(eq(products.id, id), eq(products.vendorId, vendorId)))
    .returning();

  if (!product) throw new Error("Product not found");

  revalidatePath("/products");
  return product;
}

export async function deleteProduct(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.vendorId, vendorId)));

  revalidatePath("/products");
}
