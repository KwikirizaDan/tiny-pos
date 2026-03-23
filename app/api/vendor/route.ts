import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getDb, vendors } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9-]+$/) });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const [vendor] = await db.select().from(vendors).where(eq(vendors.ownerClerkId, userId));
  return NextResponse.json(vendor ?? null);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const db = getDb();
  const [existing] = await db.select().from(vendors).where(eq(vendors.slug, parsed.data.slug));
  if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  const [vendor] = await db.insert(vendors).values({ ...parsed.data, ownerClerkId: userId }).returning();
  return NextResponse.json(vendor, { status: 201 });
}
