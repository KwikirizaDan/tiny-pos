import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Logo width={40} height={40} />
          <div>
            <div className="text-foreground font-mono text-lg font-bold">
              Tiny<span className="text-primary">POS</span>
            </div>
            <div className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
              by Binary Labs
            </div>
          </div>
        </div>

        {/* Clerk sign up */}
        <SignUp
          appearance={{
            elements: {
              rootBox: "shadow-none w-full",
              card: "bg-card border border-border shadow-none rounded-none w-full",
              headerTitle: "text-foreground font-mono",
              headerSubtitle: "text-muted-foreground",
              formFieldInput: "bg-background border-border text-foreground rounded-none focus:border-primary",
              formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-none font-mono",
              footerAction: "hidden",
              footerPages: "hidden",
            },
          }}
        />

        {/* Sign in link */}
        <p className="text-muted-foreground text-sm font-mono text-center">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/90 underline underline-offset-2 transition-colors">
            Log in
          </Link>
        </p>

        <p className="text-muted-foreground/50 text-[10px] font-mono text-center">
          TinyPOS · Binary Labs · Kampala, Uganda
        </p>
      </div>
    </div>
  );
}
