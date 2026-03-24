import { SignUpForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function SignUpPage() {
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
        <SignUpForm />
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
