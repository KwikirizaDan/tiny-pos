import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, discounts, vendors } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "flat"]),
  value: z.string(),
  minOrderAmount: z.string().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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
  const data = await db.select().from(discounts).where(eq(discounts.vendorId, vendorId));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  const [discount] = await db.insert(discounts).values({
    ...parsed.data,
    vendorId,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }).returning();
  return NextResponse.json(discount, { status: 201 });
}
