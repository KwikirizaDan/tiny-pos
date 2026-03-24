import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/auth-layout";
import { clerkAppearance } from "@/lib/clerk";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <AuthLayout
        title="sign in to your store dashboard"
        subtitle="sign in to pos"
      >
        <SignIn appearance={clerkAppearance} />

        {/* Sign up link */}
        <p className="text-muted-foreground text-sm font-mono text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-primary hover:text-primary/90 underline-offset-4 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </AuthLayout>
    );
  }

  const vendorId = await getVendorId(userId);

  if (!vendorId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
