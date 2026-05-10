import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "flat"]).optional(),
  value: z.string().optional(),
  minOrderAmount: z.string().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

  const updateData: any = {};
  if (parsed.data.code !== undefined) updateData.code = parsed.data.code;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.discountType !== undefined) updateData.discount_type = parsed.data.discountType;
  if (parsed.data.value !== undefined) updateData.value = parsed.data.value;
  if (parsed.data.minOrderAmount !== undefined) updateData.min_order_amount = parsed.data.minOrderAmount;
  if (parsed.data.maxUses !== undefined) updateData.max_uses = parsed.data.maxUses;
  if (parsed.data.expiresAt !== undefined) updateData.expires_at = parsed.data.expiresAt;
  if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

  const { data: updated, error } = await supabase
    .from('discounts')
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
    .from('discounts')
    .delete()
    .match({ id, vendor_id: vendor.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
