"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, users } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getVendorId } from "@/lib/vendor";

const staffSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["owner", "manager", "cashier"]).optional(),
  isActive: z.boolean().optional(),
});

export async function createStaff(data: z.infer<typeof staffSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = staffSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");
  if (!parsed.data.name || !parsed.data.email || !parsed.data.role) throw new Error("Missing required fields");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [staff] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      vendorId,
      clerkId: `pending_${Date.now()}`,
      isActive: true,
    })
    .returning();

  revalidatePath("/staff");
  return staff;
}

export async function updateStaff(id: string, data: z.infer<typeof staffSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = staffSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  const [staff] = await db
    .update(users)
    .set(parsed.data)
    .where(and(eq(users.id, id), eq(users.vendorId, vendorId)))
    .returning();

  if (!staff) throw new Error("Staff member not found");

  revalidatePath("/staff");
  return staff;
}

export async function deleteStaff(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();
  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.vendorId, vendorId)));

  revalidatePath("/staff");
}
