"use client";

import { Logo } from "@/components/ui/logo";

export function Preloader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-300">
      <div className="relative flex flex-col items-center">
        <div className="mb-6 animate-pulse">
          <Logo width={64} height={64} />
        </div>
        <div className="h-1 w-32 overflow-hidden bg-muted">
          <div className="h-full w-full origin-left animate-preloader bg-primary" />
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
          TinyPOS Loading...
        </p>
      </div>
    </div>
  );
}
