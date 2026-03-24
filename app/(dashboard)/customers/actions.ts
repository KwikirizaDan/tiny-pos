"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, customers } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function createCustomer(data: z.infer<typeof customerSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [customer] = await db
    .insert(customers)
    .values({ ...parsed.data, vendorId })
    .returning();

  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: z.infer<typeof customerSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [customer] = await db
    .update(customers)
    .set(parsed.data)
    .where(and(eq(customers.id, id), eq(customers.vendorId, vendorId)))
    .returning();

  if (!customer) throw new Error("Customer not found");

  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.vendorId, vendorId)));

  revalidatePath("/customers");
}
