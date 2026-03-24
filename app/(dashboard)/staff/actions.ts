"use server";

import { revalidatePath } from "next/cache";
import { getDb, users } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const staffSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["owner", "manager", "cashier"]),
  isActive: z.boolean().optional(),
});

export async function createStaff(data: z.infer<typeof staffSchema>) {
  const vendor = await getVendor();
  const parsed = staffSchema.parse(data);

  const db = getDb();
  const [staff] = await db
    .insert(users)
    .values({
      ...parsed,
      vendorId: vendor.id,
      clerkId: `pending_${Date.now()}`,
      isActive: true,
    })
    .returning();

  revalidatePath("/staff");
  return staff;
}

export async function updateStaff(id: string, data: Partial<z.infer<typeof staffSchema>>) {
  const vendor = await getVendor();
  const db = getDb();

  const [staff] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id), eq(users.vendorId, vendor.id)))
    .returning();

  if (!staff) throw new Error("Staff member not found");

  revalidatePath("/staff");
  return staff;
}

export async function deleteStaff(id: string) {
  const vendor = await getVendor();
  const db = getDb();

  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.vendorId, vendor.id)));

  revalidatePath("/staff");
  return { success: true };
}
