"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("accent_color");
    if (stored) document.documentElement.style.setProperty("--accent-color", stored);
  }, []);
  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">{children}</div>
        </main>
        <div className="md:hidden"><BottomNav /></div>
      </div>
    </div>
  );
}
