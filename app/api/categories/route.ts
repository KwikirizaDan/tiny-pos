import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, categories, vendors } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1), color: z.string().optional() });

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
  return NextResponse.json(await db.select().from(categories).where(eq(categories.vendorId, vendorId)));
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  const vendorId = await getVendorId(userId);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const db = getDb();
  const [cat] = await db.insert(categories).values({ ...parsed.data, vendorId }).returning();
  return NextResponse.json(cat, { status: 201 });
}
