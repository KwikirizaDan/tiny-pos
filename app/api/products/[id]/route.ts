import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  costPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const updateData: any = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
  if (parsed.data.costPrice !== undefined) updateData.cost_price = parsed.data.costPrice;
  if (parsed.data.stockQuantity !== undefined) updateData.stock_quantity = parsed.data.stockQuantity;
  if (parsed.data.lowStockAlert !== undefined) updateData.low_stock_alert = parsed.data.lowStockAlert;
  if (parsed.data.categoryId !== undefined) updateData.category_id = parsed.data.categoryId;
  if (parsed.data.sku !== undefined) updateData.sku = parsed.data.sku;
  if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('products')
    .update(updateData)
    .match({ id, vendor_id: vendor.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    .from('products')
    .delete()
    .match({ id, vendor_id: vendor.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
