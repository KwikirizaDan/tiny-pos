"use server";

import { revalidatePath } from "next/cache";
import { getDb, vendors, users } from "@/db";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

export async function onboardVendor(data: z.infer<typeof onboardingSchema>) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) throw new Error("Unauthorized");

  const parsed = onboardingSchema.parse(data);
  const db = getDb();

  const [existing] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, parsed.slug));

  if (existing) throw new Error("This store URL is already taken");

  const [vendor] = await db
    .insert(vendors)
    .values({
      ...parsed,
      ownerClerkId: userId,
    })
    .returning();

  // Create owner user record
  await db.insert(users).values({
    clerkId: userId,
    vendorId: vendor.id,
    email: user?.emailAddresses[0].emailAddress ?? null,
    name: user?.fullName ?? null,
    role: "owner",
    isActive: true,
  });

  revalidatePath("/");
  return vendor;
}
