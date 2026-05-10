import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getVendorFromAuthId(supabase: any, authId: string) {
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', authId)
    .single();
  return vendor ?? null;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await getVendorFromAuthId(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  if (from) query = query.gte('created_at', from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', toDate.toISOString());
  }

  const { data: allSales, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Process data in JS to match expected format
  const items: any[] = [];
  const productStats: Record<string, { totalQty: number, totalRevenue: number }> = {};
  const dailyStats: Record<string, { totalRevenue: number, totalCount: number }> = {};

  let totalRevenue = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let cashSales = 0;
  let cardSales = 0;

  allSales.forEach(sale => {
    const revenue = Number(sale.total_amount);
    totalRevenue += revenue;
    totalTax += Number(sale.tax_amount || 0);
    totalDiscount += Number(sale.discount_amount || 0);
    
    if (sale.payment_method === "cash") cashSales++;
    else if (sale.payment_method === "card") cardSales++;

    const date = new Date(sale.created_at).toISOString().split('T')[0];
    if (!dailyStats[date]) dailyStats[date] = { totalRevenue: 0, totalCount: 0 };
    dailyStats[date].totalRevenue += revenue;
    dailyStats[date].totalCount += 1;

    sale.sale_items?.forEach((item: any) => {
      items.push({
        saleId: item.sale_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      });

      if (!productStats[item.product_name]) {
        productStats[item.product_name] = { totalQty: 0, totalRevenue: 0 };
      }
      productStats[item.product_name].totalQty += item.quantity;
      productStats[item.product_name].totalRevenue += Number(item.subtotal);
    });
  });

  const topProducts = Object.entries(productStats)
    .map(([productName, stats]) => ({
      productName,
      totalQty: stats.totalQty,
      totalRevenue: stats.totalRevenue.toString(),
    }))
    .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
    .slice(0, 10);

  const daily = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      totalRevenue: stats.totalRevenue.toString(),
      totalCount: stats.totalCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    summary: {
      totalSales: allSales.length,
      totalRevenue,
      totalTax,
      totalDiscount,
      avgSale: allSales.length > 0 ? totalRevenue / allSales.length : 0,
      cashSales,
      cardSales,
    },
    sales: allSales.map(s => ({
      ...s,
      // Map back to camelCase if needed by frontend, but guideline says use snake_case for column names.
      // Usually the frontend expects the DB column names as they are returned.
    })),
    items,
    topProducts,
    daily,
  });
}
