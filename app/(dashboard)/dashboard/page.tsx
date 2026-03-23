import { getDb, sales, products, customers } from "@/db";
import { eq, desc, gte, lt, and, count, lte } from "drizzle-orm";
import { getVendor } from "@/lib/vendor";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const vendor = await getVendor();
  const db = getDb();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const vid = vendor.id;

  const [todaySales, yesterdaySales, monthSales, lastMonthSales, allProducts, custResult, recentSales] = await Promise.all([
    db.select().from(sales).where(and(eq(sales.vendorId, vid), gte(sales.createdAt, todayStart))),
    db.select().from(sales).where(and(eq(sales.vendorId, vid), gte(sales.createdAt, yesterdayStart), lt(sales.createdAt, todayStart))),
    db.select().from(sales).where(and(eq(sales.vendorId, vid), gte(sales.createdAt, monthStart))),
    db.select().from(sales).where(and(eq(sales.vendorId, vid), gte(sales.createdAt, lastMonthStart), lte(sales.createdAt, lastMonthEnd))),
    db.select().from(products).where(eq(products.vendorId, vid)),
    db.select({ count: count() }).from(customers).where(eq(customers.vendorId, vid)),
    db.select().from(sales).where(eq(sales.vendorId, vid)).orderBy(desc(sales.createdAt)).limit(8),
  ]);

  const lowStock = allProducts.filter(p => p.isActive && (p.stockQuantity ?? 0) <= (p.lowStockAlert ?? 5)).sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0));
  const todayRevenue = todaySales.reduce((s, x) => s + Number(x.totalAmount), 0);
  const yesterdayRevenue = yesterdaySales.reduce((s, x) => s + Number(x.totalAmount), 0);
  const monthRevenue = monthSales.reduce((s, x) => s + Number(x.totalAmount), 0);
  const lastMonthRevenue = lastMonthSales.reduce((s, x) => s + Number(x.totalAmount), 0);

  return (
    <DashboardClient
      kpis={{ todayRevenue, yesterdayRevenue, revenueChange: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null, todayOrders: todaySales.length, yesterdayOrders: yesterdaySales.length, monthRevenue, lastMonthRevenue, monthChange: lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null, avgSale: todaySales.length > 0 ? todayRevenue / todaySales.length : 0, totalProducts: allProducts.length, totalCustomers: custResult[0].count }}
      recentSales={recentSales} lowStock={lowStock} vendorName={vendor.name}
    />
  );
}
