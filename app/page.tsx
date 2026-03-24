import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
        {/* Background Grid & Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[440px] px-6">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo width={44} height={44} />
              <div className="flex flex-col">
                <div className="text-foreground font-mono text-2xl font-bold leading-none">
                  Tiny<span className="text-primary">POS</span>
                </div>
                <div className="text-muted-foreground font-mono text-xs tracking-tight lowercase">
                  by Binary Labs
                </div>
              </div>
            </div>
            <p className="text-muted-foreground font-mono text-sm lowercase">
              sign in to your store dashboard
            </p>
          </div>

          {/* Clerk sign in */}
          <SignIn
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: "#7c3aed",
                colorBackground: "#18181b",
                colorText: "#f8fafc",
                colorTextSecondary: "#94a3b8",
                colorInputBackground: "#09090b",
                colorInputText: "#f8fafc",
                colorTextOnPrimaryBackground: "#ffffff",
                fontFamily: "var(--font-mono)",
              },
              elements: {
                rootBox: "shadow-none w-full",
                cardBox: "shadow-none w-full",
                card: "bg-card/80 backdrop-blur-sm border border-border/50 shadow-2xl rounded-2xl w-full p-4",
                header: "items-center text-center mb-8",
                headerTitle: "text-foreground font-mono text-xl font-bold lowercase",
                headerSubtitle: "text-muted-foreground font-mono text-sm mt-1 lowercase",
                socialButtonsBlockButton: "bg-background/50 border border-border/50 hover:bg-accent/50 text-foreground font-mono rounded-lg transition-all h-12",
                socialButtonsBlockButtonText: "font-mono font-medium",
                dividerLine: "bg-border/30",
                dividerText: "text-muted-foreground font-mono text-xs lowercase px-4",
                formFieldLabel: "text-foreground font-mono text-sm mb-2 lowercase",
                formFieldInput: "bg-background/50 border-border/50 text-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono h-12",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-mono font-bold transition-all h-12 text-base",
                footer: "hidden",
                identityPreview: "bg-background/50 border-border/50 rounded-lg",
              },
            }}
            localization={{
              signIn: {
                start: {
                  title: "sign in to pos",
                  subtitle: "welcome back! please sign in to continue",
                  actionPrimaryText: "continue ▸",
                },
              },
            }}
          />

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
