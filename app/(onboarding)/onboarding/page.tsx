import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb, vendors } from "@/db";
import { eq } from "drizzle-orm";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const db = getDb();
  const [existing] = await db.select().from(vendors).where(eq(vendors.ownerClerkId, userId));
  if (existing) redirect("/dashboard");
  return <OnboardingClient />;
}
