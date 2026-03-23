import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, inventoryLogs, products, vendors } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  productId: z.string().uuid(),
  changeType: z.enum(["sale", "refund", "restock", "adjustment", "damage"]),
  quantityChange: z.number().int(),
  notes: z.string().optional(),
});

async function getVendorId(clerkId: string) {
  const db = getDb();
  const [v] = await db.select().from(vendors).where(eq(vendors.ownerClerkId, clerkId));
  return v?.id ?? null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  const data = await db.select().from(inventoryLogs)
    .where(eq(inventoryLogs.vendorId, vendorId)).orderBy(desc(inventoryLogs.createdAt)).limit(200);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, parsed.data.productId));
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const before = product.stockQuantity ?? 0;
  const after = before + parsed.data.quantityChange;
  const [log] = await db.insert(inventoryLogs).values({
    ...parsed.data,
    vendorId,
    quantityBefore: before,
    quantityAfter: after,
  }).returning();
  await db.update(products).set({ stockQuantity: after, updatedAt: new Date() })
    .where(eq(products.id, parsed.data.productId));
  return NextResponse.json(log, { status: 201 });
}
