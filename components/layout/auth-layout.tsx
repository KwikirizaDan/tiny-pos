import { Logo } from "@/components/ui/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
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
            {title}
          </p>
        </div>

        {children}

        {/* Custom subtitle/footer if needed, but pages usually have their own links */}
      </div>
    </div>
  );
}
