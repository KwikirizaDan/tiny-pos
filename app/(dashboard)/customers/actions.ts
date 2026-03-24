"use server";

import { revalidatePath } from "next/cache";
import { getDb, customers } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  loyaltyPoints: z.number().int().min(0).optional(),
});

export async function createCustomer(data: z.infer<typeof customerSchema>) {
  const vendor = await getVendor();
  const parsed = customerSchema.parse(data);

  const db = getDb();
  const [customer] = await db
    .insert(customers)
    .values({
      ...parsed,
      vendorId: vendor.id,
    })
    .returning();

  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: Partial<z.infer<typeof customerSchema>>) {
  const vendor = await getVendor();
  const db = getDb();

  const [customer] = await db
    .update(customers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, id), eq(customers.vendorId, vendor.id)))
    .returning();

  if (!customer) throw new Error("Customer not found");

  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const vendor = await getVendor();
  const db = getDb();

  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.vendorId, vendor.id)));

  revalidatePath("/customers");
  return { success: true };
}
