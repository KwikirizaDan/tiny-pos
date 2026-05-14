import { createClient } from "@/lib/supabase/server";
import { resolveVendor } from "@/lib/vendor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string().uuid(),
  changeType: z.enum(["sale", "refund", "restock", "adjustment", "damage"]),
  quantityChange: z.number().int(),
  notes: z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', parsed.data.productId)
    .eq('vendor_id', vendor.id)
    .single();

  if (productError || !product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const before = product.stock_quantity ?? 0;
  const after = before + parsed.data.quantityChange;

  const { data: log, error: logError } = await supabase
    .from('inventory_logs')
    .insert({
      product_id: parsed.data.productId,
      vendor_id: vendor.id,
      change_type: parsed.data.changeType,
      quantity_change: parsed.data.quantityChange,
      quantity_before: before,
      quantity_after: after,
      notes: parsed.data.notes,
    })
    .select()
    .single();

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

  await supabase
    .from('products')
    .update({ stock_quantity: after, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.productId)
    .eq('vendor_id', vendor.id);

  return NextResponse.json(log, { status: 201 });
}
