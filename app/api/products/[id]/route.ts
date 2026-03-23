import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, products, vendors } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  costPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
});

async function getVendorId(clerkId: string): Promise<string | null> {
  const db = getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.ownerClerkId, clerkId));
  return vendor?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const db = getDb();
  const [updated] = await db
    .update(products)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.vendorId, vendorId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const db = getDb();
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.vendorId, vendorId)));

  return NextResponse.json({ success: true });
}
