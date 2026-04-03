"use client";
import { UserButton } from "@clerk/nextjs";
import { Moon, Sun, Monitor, Download } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

type Theme = "dark" | "light" | "system";

export function Header() {
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = stored === "system" || !stored ? prefersDark : stored === "dark";
    setTheme(stored || "system");
    setIsDark(resolved);
    document.documentElement.classList.toggle("dark", resolved);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installPwa = useCallback(async () => {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === "accepted") {
        toast.success("TinyPOS installed!");
      }
      setDeferredPrompt(null);
    } else if ("standalone" in window) {
      toast.info("TinyPOS is already installed!");
    } else {
      toast.info("To install: open URL in browser menu → Install");
    }
  }, [deferredPrompt]);

  const cycleTheme = () => {
    const order: Theme[] = ["dark", "light", "system"];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = next === "system" ? prefersDark : next === "dark";
    setIsDark(resolved);
    document.documentElement.classList.toggle("dark", resolved);
    localStorage.setItem("theme", next);
  };

  const userButtonAppearance = useMemo(() => ({
    elements: {
      avatarBox: "w-8 h-8",
      userButtonPopoverCard: "bg-background border border-border shadow-md",
      userButtonPopoverActionButton: "font-mono text-sm rounded-none hover:bg-accent",
    },
  }), []);



  const getIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    return theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  const getTitle = () => {
    const titles: Record<Theme, string> = {
      dark: "Dark mode (click for system)",
      light: "Light mode (click for dark)",
      system: "System theme (click for light)",
    };
    return titles[theme];
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-muted-foreground" />
      <div className="flex items-center gap-3">
        <button
          onClick={installPwa}
          className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Install TinyPOS"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={cycleTheme}
          className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title={getTitle()}
        >
          {getIcon()}
        </button>
        <UserButton appearance={userButtonAppearance} />
      </div>
    </header>
  );
}
