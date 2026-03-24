import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import { clerkAppearance } from "@/lib/clerk";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 mb-8">
        <Logo width={48} height={48} />
        <h1 className="text-2xl font-bold font-mono text-foreground">
          Tiny<span className="text-primary">POS</span>
        </h1>
      </div>
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}