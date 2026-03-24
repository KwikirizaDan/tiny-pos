import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/auth-layout";
import { clerkAppearance } from "@/lib/clerk";

export default function SignUpPage() {
  return (
    <AuthLayout
      title="create your store account"
      subtitle="create account"
    >
      <SignUp appearance={clerkAppearance} />

      {/* Sign in link */}
      <p className="text-muted-foreground text-sm font-mono text-center">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-primary hover:text-primary/90 underline-offset-4 transition-colors"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
