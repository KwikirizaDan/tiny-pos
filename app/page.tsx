import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk";
import { Logo } from "@/components/ui/logo";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Logo width={48} height={48} />
          <h1 className="text-2xl font-bold font-mono text-foreground">
            Tiny<span className="text-primary">POS</span>
          </h1>
        </div>
        <SignIn appearance={clerkAppearance} />
      </div>
    );
  }

  const vendorId = await getVendorId(userId);

  if (!vendorId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}