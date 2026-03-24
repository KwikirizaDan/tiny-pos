import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getVendorId } from "@/lib/vendor";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo width={40} height={40} />
            <div>
              <div className="text-white font-mono text-lg font-bold">
                Tiny<span className="text-violet-400">POS</span>
              </div>
              <div className="text-zinc-600 font-mono text-[10px] tracking-widest">
                by Binary Labs
              </div>
            </div>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "shadow-none",
                card: "bg-zinc-900 border border-zinc-800 shadow-none rounded-none",
                headerTitle: "text-white font-mono",
                headerSubtitle: "text-zinc-400",
                formFieldInput:
                  "bg-zinc-950 border-zinc-700 text-zinc-100 rounded-none focus:border-violet-500",
                formButtonPrimary:
                  "bg-violet-600 hover:bg-violet-700 rounded-none font-mono",
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
