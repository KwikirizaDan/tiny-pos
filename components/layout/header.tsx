"use client";
import { UserButton } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { userButtonAppearance } from "@/lib/clerk";

export function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-muted-foreground" />
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <UserButton appearance={userButtonAppearance} />
      </div>
    </header>
  );
}
