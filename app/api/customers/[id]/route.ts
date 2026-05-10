import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const updateData: any = { ...parsed.data };
  if (updateData.loyaltyPoints !== undefined) {
    updateData.loyalty_points = updateData.loyaltyPoints;
    delete updateData.loyaltyPoints;
  }
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('customers')
    .update(updateData)
    .match({ id, vendor_id: vendor.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { error } = await supabase
    .from('customers')
    .delete()
    .match({ id, vendor_id: vendor.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
