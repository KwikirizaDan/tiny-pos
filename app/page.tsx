import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { SignIn } from "@clerk/nextjs";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SignIn />
      </div>
    );
  }

  const vendorId = await getVendorId(userId);

  if (!vendorId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}