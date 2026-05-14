import { createClient } from "@/lib/supabase/server";
import { resolveVendor } from "@/lib/vendor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]),
  costPrice: z.union([z.string(), z.number()]).optional(),
  stockQuantity: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      cost_price: parsed.data.costPrice,
      stock_quantity: parsed.data.stockQuantity,
      low_stock_alert: parsed.data.lowStockAlert,
      category_id: parsed.data.categoryId,
      sku: parsed.data.sku,
      is_active: parsed.data.isActive,
      vendor_id: vendor.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(product, { status: 201 });
}


