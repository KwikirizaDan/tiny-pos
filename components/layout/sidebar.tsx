"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ShoppingCart, Monitor,
  ChevronLeft, ChevronRight, QrCode, ScanLine, Tag,
  Users, Percent, UserCog, Settings, RefreshCcw,
  Archive, Shield, BarChart3,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const navGroups = [
  {
    label: "Selling",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/pos", label: "Terminal", icon: Monitor },
      { href: "/scan", label: "Scan POS", icon: ScanLine },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/refunds", label: "Refunds", icon: RefreshCcw },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: Tag },
      { href: "/qr-codes", label: "QR Codes", icon: QrCode },
      { href: "/inventory", label: "Inventory", icon: Archive },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/discounts", label: "Discounts", icon: Percent },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/staff", label: "Staff", icon: UserCog },
      { href: "/audit", label: "Audit Logs", icon: Shield },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className={cn(
      "border-r bg-card flex flex-col shrink-0 transition-all duration-300",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Logo width={28} height={28} />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm tracking-tight whitespace-nowrap">
                Tiny<span className="text-violet-400">POS</span>
              </span>
              <span className="text-[9px] text-muted-foreground tracking-widest">
                by Binary Labs
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 pt-3 pb-1">
                {group.label}
              </p>
            )}
            {collapsed && <div className="pt-2" />}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-2 text-sm transition-colors",
                      collapsed ? "justify-center" : "",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            v0.1.0 · TinyPOS
          </p>
        </div>
      )}
    </aside>
  );
}
