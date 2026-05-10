"use client";
import { useEffect, useState, memo } from "react";

const ClientDate = memo(function ClientDate() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(new Date().toLocaleDateString("en-UG", { weekday: "long", day: "numeric", month: "long" }));
  }, []);
  return <>{label}</>;
});
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Package, Users, AlertTriangle, ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale, Product } from "@/types/pos";
import Link from "next/link";

interface KPIs {
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueChange: number | null;
  todayOrders: number;
  yesterdayOrders: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  monthChange: number | null;
  avgSale: number;
  totalProducts: number;
  totalCustomers: number;
}

interface Props {
  kpis: KPIs;
  recentSales: Sale[];
  lowStock: Product[];
  vendorName: string;
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">no data</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-500" : "text-red-500"}`}>
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}{value}% vs yesterday
    </span>
  );
}

const statusVariant: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  refunded: "bg-zinc-500/10 text-zinc-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export function DashboardClient({ kpis, recentSales, lowStock, vendorName }: Props) {
  const [accentColor, setAccentColor] = useState("#7c3aed");

  useEffect(() => {
    const stored = localStorage.getItem("accent_color");
    if (stored) {
      setAccentColor(stored);
      document.documentElement.style.setProperty("--accent-color", stored);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {vendorName} · <ClientDate />
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today revenue */}
        <div className="border bg-card p-4 space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Today</span>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-medium tracking-tight">{formatCurrency(kpis.todayRevenue)}</div>
          <Trend value={kpis.revenueChange} />
        </div>

        {/* Today orders */}
        <div className="border bg-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Orders</span>
            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-medium tracking-tight">{kpis.todayOrders}</div>
          <span className="text-xs text-muted-foreground">
            {kpis.yesterdayOrders} yesterday
          </span>
        </div>

        {/* Month revenue */}
        <div className="border bg-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">This month</span>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-medium tracking-tight">{formatCurrency(kpis.monthRevenue)}</div>
          {kpis.monthChange !== null && (
            <span className={`text-xs font-medium flex items-center gap-1 ${kpis.monthChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {kpis.monthChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {kpis.monthChange >= 0 ? "+" : ""}{kpis.monthChange}% vs last month
            </span>
          )}
        </div>

        {/* Avg sale */}
        <div className="border bg-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg sale</span>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-medium tracking-tight">{formatCurrency(kpis.avgSale)}</div>
          <span className="text-xs text-muted-foreground">per transaction today</span>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium">{kpis.totalProducts}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </div>
          <Link href="/products" className="ml-auto text-xs text-muted-foreground hover:text-primary">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium">{kpis.totalCustomers}</p>
            <p className="text-xs text-muted-foreground">Customers</p>
          </div>
          <Link href="/customers" className="ml-auto text-xs text-muted-foreground hover:text-primary">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent sales */}
        <div className="lg:col-span-2 border bg-card">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-medium text-sm">Recent sales</span>
            <Link href="/orders" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No sales yet —{" "}
                <Link href="/pos" className="text-primary underline underline-offset-2">open the POS</Link>
              </div>
            ) : recentSales.map((sale) => (
              <div key={sale.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                  {sale.id.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-mono">{sale.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt!)} · {sale.paymentMethod}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 capitalize font-medium ${statusVariant[sale.status ?? "completed"] ?? ""}`}>
                  {sale.status}
                </span>
                <span className="text-sm font-medium ml-2 shrink-0">{formatCurrency(Number(sale.totalAmount))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="border bg-card">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">Low stock</span>
            </div>
            <Link href="/inventory" className="text-xs text-primary hover:underline">Manage</Link>
          </div>
          <div className="divide-y">
            {lowStock.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                  <Package className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-xs text-muted-foreground">All stock levels are good</p>
              </div>
            ) : lowStock.slice(0, 8).map((product) => {
              const qty = product.stockQuantity ?? 0;
              const isCritical = qty <= 2;
              return (
                <div key={product.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className="text-sm flex-1 truncate">{product.name}</span>
                  <span className={`text-xs font-medium shrink-0 ${isCritical ? "text-red-500" : "text-amber-500"}`}>
                    {qty} left
                  </span>
                </div>
              );
            })}
            {lowStock.length > 8 && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                +{lowStock.length - 8} more items
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
