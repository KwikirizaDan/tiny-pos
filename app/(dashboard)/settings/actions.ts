"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb, vendorSettings } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendorId } from "@/lib/vendor";

export async function updateVendorSetting(key: string, value: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const vendorId = await getVendorId(userId);
  if (!vendorId) throw new Error("Vendor not found");

  const db = getDb();

  const [existing] = await db
    .select()
    .from(vendorSettings)
    .where(and(eq(vendorSettings.vendorId, vendorId), eq(vendorSettings.key, key)));

  if (existing) {
    await db
      .update(vendorSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(vendorSettings.id, existing.id));
  } else {
    await db
      .insert(vendorSettings)
      .values({ vendorId, key, value });
  }

  revalidatePath("/settings");
}
