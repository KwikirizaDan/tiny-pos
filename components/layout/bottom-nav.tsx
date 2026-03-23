"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Monitor, ShoppingCart, Package, ScanLine } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/pos", label: "Terminal", icon: Monitor },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href}
            className={cn("flex-1 flex flex-col items-center justify-center gap-1 h-16 transition-colors",
              active ? "text-primary" : "text-muted-foreground")}>
            <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
