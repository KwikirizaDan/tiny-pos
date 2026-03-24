import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary text-primary-foreground">
                <Logo width={24} height={24} className="brightness-0 invert" />
              </div>
              <span className="sr-only">TinyPOS</span>
            </Link>
            <h1 className="text-xl font-bold font-mono">Tiny<span className="text-primary">POS</span></h1>
          </div>
          <LoginForm />
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vendorId = await getVendorId(userId);

  if (!vendorId) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
