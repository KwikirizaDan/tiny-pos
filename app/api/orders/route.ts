import { createClient } from "@/lib/supabase/server";
import { resolveVendor } from "@/lib/vendor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  cashierId: z.string().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({ productId: z.string().uuid(), productName: z.string(), quantity: z.number().int().positive(), unitPrice: z.string() })),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data, error } = await supabase
    .from('sales')
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

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { items, cashierId, customerId, paymentMethod, notes } = parsed.data;

  const { data: dbProducts, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', items.map(i => i.productId))
    .eq('vendor_id', vendor.id);

  if (productsError || !dbProducts || dbProducts.length !== items.length) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 404 });
  }

  const subtotal = items.reduce((sum, item) => {
    const p = dbProducts.find(p => p.id === item.productId)!;
    return sum + Number(p.price) * item.quantity;
  }, 0);
  const totalAmount = subtotal;

  try {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        vendor_id: vendor.id,
        cashier_id: cashierId ?? null,
        customer_id: customerId ?? null,
        subtotal: subtotal.toFixed(2),
        tax_amount: "0",
        discount_amount: "0",
        total_amount: totalAmount.toFixed(2),
        payment_method: paymentMethod,
        notes: notes ?? null,
        status: "completed",
      })
      .select()
      .single();

    if (saleError) throw saleError;

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(items.map(item => {
        const p = dbProducts.find(p => p.id === item.productId)!;
        return {
          sale_id: sale.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: p.price,
          subtotal: (Number(p.price) * item.quantity).toFixed(2)
        };
      }));

    if (itemsError) throw itemsError;

    for (const item of items) {
      const { data: ok } = await supabase.rpc("decrement_stock", {
        p_id: item.productId,
        p_quantity: item.quantity,
      });
      if (ok === false) {
        throw new Error(`Insufficient stock for product: ${item.productName}`);
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong. Please try again." }, { status: 500 });
  }
}
