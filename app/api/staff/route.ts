import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, users, vendors } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["owner", "manager", "cashier"]),
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
  const data = await db.select().from(users).where(eq(users.vendorId, vendorId));
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
  const [staff] = await db.insert(users).values({
    ...parsed.data,
    vendorId,
    clerkId: `pending_${Date.now()}`,
    isActive: true,
  }).returning();
  return NextResponse.json(staff, { status: 201 });
}
