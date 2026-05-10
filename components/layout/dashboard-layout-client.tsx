"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

type UserRole = "owner" | "manager" | "cashier";

export function DashboardLayoutClient({ children, userRole }: { children: React.ReactNode; userRole: UserRole }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("accent_color");
    if (stored) document.documentElement.style.setProperty("--accent-color", stored);
  }, []);
  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} userRole={userRole} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
