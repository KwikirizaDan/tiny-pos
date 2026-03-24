"use server";

import { revalidatePath } from "next/cache";
import { getDb, vendorSettings } from "@/db";
import { eq, and } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { z } from "zod";

const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
});

export async function updateSetting(data: z.infer<typeof settingSchema>) {
  const vendor = await getVendor();
  const parsed = settingSchema.parse(data);

  const db = getDb();
  const [existing] = await db
    .select()
    .from(vendorSettings)
    .where(and(eq(vendorSettings.vendorId, vendor.id), eq(vendorSettings.key, parsed.key)));

  if (existing) {
    await db
      .update(vendorSettings)
      .set({
        value: parsed.value,
        updatedAt: new Date(),
      })
      .where(and(eq(vendorSettings.vendorId, vendor.id), eq(vendorSettings.key, parsed.key)));
  } else {
    await db.insert(vendorSettings).values({
      ...parsed,
      vendorId: vendor.id,
    });
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateMultipleSettings(settings: Record<string, string>) {
    const vendor = await getVendor();
    const db = getDb();

    for (const [key, value] of Object.entries(settings)) {
        const [existing] = await db
            .select()
            .from(vendorSettings)
            .where(and(eq(vendorSettings.vendorId, vendor.id), eq(vendorSettings.key, key)));

        if (existing) {
            await db
                .update(vendorSettings)
                .set({
                    value,
                    updatedAt: new Date(),
                })
                .where(and(eq(vendorSettings.vendorId, vendor.id), eq(vendorSettings.key, key)));
        } else {
            await db.insert(vendorSettings).values({
                vendorId: vendor.id,
                key,
                value,
            });
        }
    }

    revalidatePath("/settings");
    return { success: true };
}
