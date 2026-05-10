import { createClient } from "@/lib/supabase/server";
import { getVendor } from "@/lib/vendor";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const vendor = await getVendor();
  const supabase = await createClient();
  const vid = vendor.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    { data: todaySales },
    { data: yesterdaySales },
    { data: monthSales },
    { data: lastMonthSales },
    { data: allProducts },
    { count: customerCount },
    { data: recentSales }
  ] = await Promise.all([
    supabase.from('sales').select('*').eq('vendor_id', vid).gte('created_at', todayStart.toISOString()),
    supabase.from('sales').select('*').eq('vendor_id', vid).gte('created_at', yesterdayStart.toISOString()).lt('created_at', todayStart.toISOString()),
    supabase.from('sales').select('*').eq('vendor_id', vid).gte('created_at', monthStart.toISOString()),
    supabase.from('sales').select('*').eq('vendor_id', vid).gte('created_at', lastMonthStart.toISOString()).lte('created_at', lastMonthEnd.toISOString()),
    supabase.from('products').select('*').eq('vendor_id', vid),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('vendor_id', vid),
    supabase.from('sales').select('*').eq('vendor_id', vid).order('created_at', { ascending: false }).limit(8),
  ]);

  const todayRevenue = (todaySales || []).reduce((s, x) => s + Number(x.total_amount), 0);
  const yesterdayRevenue = (yesterdaySales || []).reduce((s, x) => s + Number(x.total_amount), 0);
  const monthRevenue = (monthSales || []).reduce((s, x) => s + Number(x.total_amount), 0);
  const lastMonthRevenue = (lastMonthSales || []).reduce((s, x) => s + Number(x.total_amount), 0);

  const lowStock = (allProducts || [])
    .filter(p => p.is_active && (p.stock_quantity ?? 0) <= (p.low_stock_alert ?? 5))
    .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0))
    .map(p => ({
      id: p.id,
      name: p.name,
      stockQuantity: p.stock_quantity,
      lowStockAlert: p.low_stock_alert,
      isActive: p.is_active
    }));

  const mappedRecentSales = (recentSales || []).map(s => ({
    id: s.id,
    createdAt: s.created_at,
    paymentMethod: s.payment_method,
    status: s.status,
    totalAmount: Number(s.total_amount),
  }));

  return (
    <DashboardClient
      kpis={{
        todayRevenue,
        yesterdayRevenue,
        revenueChange: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null,
        todayOrders: todaySales?.length ?? 0,
        yesterdayOrders: yesterdaySales?.length ?? 0,
        monthRevenue,
        lastMonthRevenue,
        monthChange: lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null,
        avgSale: (todaySales?.length ?? 0) > 0 ? todayRevenue / (todaySales?.length ?? 1) : 0,
        totalProducts: allProducts?.length ?? 0,
        totalCustomers: customerCount ?? 0
      }}
      recentSales={mappedRecentSales as any}
      lowStock={lowStock as any}
      vendorName={vendor.name}
    />
  );
}
