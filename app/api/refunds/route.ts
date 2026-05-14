import { createClient } from "@/lib/supabase/server";
import { resolveVendor } from "@/lib/vendor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  saleId: z.string().uuid(),
  amount: z.union([z.string(), z.number()]),
  reason: z.string().optional()
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data, error } = await supabase
    .from('refunds')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

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

  // SECURITY FIX: Verify sale belongs to this vendor
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*')
    .eq('id', parsed.data.saleId)
    .eq('vendor_id', vendor.id)
    .single();

  if (saleError || !sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.status === "refunded") return NextResponse.json({ error: "Already refunded" }, { status: 409 });

  const { data: refund, error: refundError } = await supabase
    .from('refunds')
    .insert({
      sale_id: parsed.data.saleId,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      vendor_id: vendor.id,
      status: "processed"
    })
    .select()
    .single();

  if (refundError) return NextResponse.json({ error: refundError.message }, { status: 500 });

  await supabase
    .from('sales')
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq('id', parsed.data.saleId)
    .eq('vendor_id', vendor.id);

  return NextResponse.json(refund, { status: 201 });
}
