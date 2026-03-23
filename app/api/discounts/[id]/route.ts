import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, discounts, vendors } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "flat"]).optional(),
  value: z.string().optional(),
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  const [updated] = await db.update(discounts).set({
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }).where(and(eq(discounts.id, id), eq(discounts.vendorId, vendorId))).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  await db.delete(discounts).where(and(eq(discounts.id, id), eq(discounts.vendorId, vendorId)));
  return NextResponse.json({ success: true });
}
