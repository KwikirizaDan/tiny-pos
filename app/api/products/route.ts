import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, products } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().min(1),
  costPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const vendor = await getVendorFromClerkId(userId);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const data = await db.select().from(products).where(eq(products.vendorId, vendor.id));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const db = getDb();
  const vendor = await getVendorFromClerkId(userId);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const [product] = await db
    .insert(products)
    .values({ ...parsed.data, vendorId: vendor.id })
    .returning();

  return NextResponse.json(product, { status: 201 });
}

async function getVendorFromClerkId(clerkId: string) {
  const { getDb: gdb, vendors } = await import("@/db");
  const { eq: eqOp } = await import("drizzle-orm");
  const db = gdb();
  const [vendor] = await db.select().from(vendors).where(eqOp(vendors.ownerClerkId, clerkId));
  return vendor ?? null;
}
