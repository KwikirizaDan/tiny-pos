import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, vendorSettings, vendors } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  key: z.string().min(1),
  value: z.string(),
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
  const data = await db.select().from(vendorSettings).where(eq(vendorSettings.vendorId, vendorId));
  const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
  return NextResponse.json(map);
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
  const [existing] = await db.select().from(vendorSettings)
    .where(and(eq(vendorSettings.vendorId, vendorId), eq(vendorSettings.key, parsed.data.key)));
  if (existing) {
    await db.update(vendorSettings).set({ value: parsed.data.value, updatedAt: new Date() })
      .where(and(eq(vendorSettings.vendorId, vendorId), eq(vendorSettings.key, parsed.data.key)));
  } else {
    await db.insert(vendorSettings).values({ ...parsed.data, vendorId });
  }
  return NextResponse.json({ success: true });
}
