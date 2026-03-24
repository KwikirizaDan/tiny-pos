import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo width={40} height={40} />
            <div>
              <div className="text-foreground font-mono text-lg font-bold">
                Tiny<span className="text-primary">POS</span>
              </div>
              <div className="text-muted-foreground font-mono text-[10px] tracking-widest">
                by Binary Labs
              </div>
            </div>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "shadow-none",
                card: "bg-card border border-border shadow-none rounded-none",
                headerTitle: "text-card-foreground font-mono",
                headerSubtitle: "text-muted-foreground",
                formFieldInput:
                  "bg-background border-border text-foreground rounded-none focus:border-primary",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-mono",
                footerAction: "hidden",
                footerPages: "hidden",
              },
            }}
          />
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
