import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, sales, saleItems, products, customers, categories } from "@/db";
import { eq, gte, lte, and, desc, sum, count, sql } from "drizzle-orm";

async function getVendorId(clerkId: string) {
  const { getDb: gdb, vendors } = await import("@/db");
  const { eq: eqOp } = await import("drizzle-orm");
  const db = gdb();
  const [v] = await db.select().from(vendors).where(eqOp(vendors.ownerClerkId, clerkId));
  return v?.id ?? null;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const db = getDb();

  const conditions = [eq(sales.vendorId, vendorId)];
  if (from) conditions.push(gte(sales.createdAt, new Date(from)));
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(sales.createdAt, toDate));
  }

  // All sales in range
  const allSales = await db.select().from(sales)
    .where(and(...conditions)).orderBy(desc(sales.createdAt));

  // Sales items with product names
  const saleIds = allSales.map((s) => s.id);
  let items: any[] = [];
  if (saleIds.length > 0) {
    items = await db.select({
      saleId: saleItems.saleId,
      productName: saleItems.productName,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      subtotal: saleItems.subtotal,
    }).from(saleItems);
  }

  // Top products
  const topProducts = await db.select({
    productName: saleItems.productName,
    totalQty: sql<number>`sum(${saleItems.quantity})`.mapWith(Number),
    totalRevenue: sql<string>`sum(${saleItems.subtotal})`,
  }).from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(...conditions))
    .groupBy(saleItems.productName)
    .orderBy(sql`sum(${saleItems.subtotal}) desc`)
    .limit(10);

  // Daily breakdown
  const daily = await db.select({
    date: sql<string>`date(${sales.createdAt})`,
    totalRevenue: sql<string>`sum(${sales.totalAmount})`,
    totalCount: sql<number>`count(*)`.mapWith(Number),
  }).from(sales)
    .where(and(...conditions))
    .groupBy(sql`date(${sales.createdAt})`)
    .orderBy(sql`date(${sales.createdAt})`);

  // Summary
  const totalRevenue = allSales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
  const totalTax = allSales.reduce((s, sale) => s + Number(sale.taxAmount ?? 0), 0);
  const totalDiscount = allSales.reduce((s, sale) => s + Number(sale.discountAmount ?? 0), 0);
  const cashSales = allSales.filter((s) => s.paymentMethod === "cash").length;
  const cardSales = allSales.filter((s) => s.paymentMethod === "card").length;

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
    sales: allSales,
    items,
    topProducts,
    daily,
  });
}
