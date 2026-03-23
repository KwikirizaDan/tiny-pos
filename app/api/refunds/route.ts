import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, refunds, sales, vendors } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({ saleId: z.string().uuid(), amount: z.string(), reason: z.string().optional() });

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
  const data = await db.select().from(refunds).where(eq(refunds.vendorId, vendorId)).orderBy(desc(refunds.createdAt));
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
  // SECURITY FIX: Verify sale belongs to this vendor
  const [sale] = await db.select().from(sales).where(and(eq(sales.id, parsed.data.saleId), eq(sales.vendorId, vendorId)));
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.status === "refunded") return NextResponse.json({ error: "Already refunded" }, { status: 409 });
  const [refund] = await db.insert(refunds).values({ ...parsed.data, vendorId, status: "processed" }).returning();
  await db.update(sales).set({ status: "refunded", updatedAt: new Date() }).where(and(eq(sales.id, parsed.data.saleId), eq(sales.vendorId, vendorId)));
  return NextResponse.json(refund, { status: 201 });
}
