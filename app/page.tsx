import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getVendorId } from "@/lib/vendor";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const vendorId = await getVendorId(userId);

  if (!vendorId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}