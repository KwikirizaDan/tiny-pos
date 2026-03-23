import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, sales, saleItems, products, vendors } from "@/db";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  cashierId: z.string().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({ productId: z.string().uuid(), productName: z.string(), quantity: z.number().int().positive(), unitPrice: z.string() })),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

async function getVendorId(clerkId: string) {
  const db = getDb();
  const [v] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.ownerClerkId, clerkId));
  return v?.id ?? null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  const data = await db.select().from(sales).where(eq(sales.vendorId, vendorId)).orderBy(desc(sales.createdAt)).limit(200);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const db = getDb();
  const { items, cashierId, customerId, paymentMethod, notes } = parsed.data;

  // SECURITY FIX: Verify all products belong to this vendor and get real prices
  const dbProducts = await db.select().from(products)
    .where(and(inArray(products.id, items.map(i => i.productId)), eq(products.vendorId, vendorId)));

  if (dbProducts.length !== items.length) return NextResponse.json({ error: "One or more products not found" }, { status: 404 });

  // SECURITY FIX: Calculate totals server-side from real DB prices
  const subtotal = items.reduce((sum, item) => {
    const p = dbProducts.find(p => p.id === item.productId)!;
    return sum + Number(p.price) * item.quantity;
  }, 0);
  const totalAmount = subtotal;

  try {
    const [sale] = await db.insert(sales).values({
      vendorId, // SECURITY FIX: from server, not client
      cashierId: cashierId ?? null,
      customerId: customerId ?? null,
      subtotal: subtotal.toFixed(2),
      taxAmount: "0",
      discountAmount: "0",
      totalAmount: totalAmount.toFixed(2),
      paymentMethod, notes: notes ?? null, status: "completed",
    }).returning();

    await db.insert(saleItems).values(items.map(item => {
      const p = dbProducts.find(p => p.id === item.productId)!;
      return { saleId: sale.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: p.price, subtotal: (Number(p.price) * item.quantity).toFixed(2) };
    }));

    // SECURITY FIX: scope stock updates to vendorId
    for (const item of items) {
      await db.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`, updatedAt: new Date() })
        .where(and(eq(products.id, item.productId), eq(products.vendorId, vendorId)));
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
