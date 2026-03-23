import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { vendorId, email, name } = await req.json();
  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.clerkId, userId));
  if (existing) return NextResponse.json(existing);
  const [user] = await db.insert(users).values({ clerkId: userId, vendorId, email, name, role: "owner" }).returning();
  return NextResponse.json(user, { status: 201 });
}
