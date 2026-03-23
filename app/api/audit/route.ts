import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb, auditLogs, vendors } from "@/db";
import { eq, desc } from "drizzle-orm";

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
  const data = await db.select().from(auditLogs)
    .where(eq(auditLogs.vendorId, vendorId)).orderBy(desc(auditLogs.createdAt)).limit(200);
  return NextResponse.json(data);
}
