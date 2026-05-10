import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["processed", "pending", "rejected"]).optional(),
  reason: z.string().optional(),
});

async function getVendorFromAuthId(supabase: any, authId: string) {
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', authId)
    .single();
  return vendor ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const vendor = await getVendorFromAuthId(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data: updated, error } = await supabase
    .from('refunds')
    .update(parsed.data)
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .select()
    .single();

  if (error || !updated) return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
