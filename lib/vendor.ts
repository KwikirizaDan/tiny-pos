import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb, vendors, users } from "@/db";
import { eq } from "drizzle-orm";

export async function getVendor() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const db = getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.ownerClerkId, userId));
  if (!vendor) redirect("/onboarding");
  return vendor;
}

export async function getVendorId(clerkId: string): Promise<string | null> {
  const db = getDb();
  const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.ownerClerkId, clerkId));
  return vendor?.id ?? null;
}

export async function getVendorUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
  return user ?? null;
}
