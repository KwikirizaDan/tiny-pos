"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getDb, vendors, users } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export async function createVendor(data: z.infer<typeof onboardingSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input data");

  const db = getDb();

  const [existing] = await db.select().from(vendors).where(eq(vendors.ownerClerkId, userId));
  if (existing) redirect("/dashboard");

  await db.transaction(async (tx) => {
    const [vendor] = await tx
      .insert(vendors)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        ownerClerkId: userId,
      })
      .returning();

    await tx.insert(users).values({
      clerkId: userId,
      vendorId: vendor.id,
      name: parsed.data.name,
      role: "owner",
      isActive: true,
    });
  });

  redirect("/dashboard");
}
