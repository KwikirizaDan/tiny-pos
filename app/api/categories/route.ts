import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ 
  name: z.string().min(1), 
  color: z.string().optional() 
});

async function getVendorId(supabase: any, authId: string) {
  const { data: v } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', authId)
    .single();
  return v?.id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = await getVendorId(supabase, user.id);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data: catList } = await supabase
    .from('categories')
    .select('*')
    .eq('vendor_id', vendorId);

  return NextResponse.json(catList);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const vendorId = await getVendorId(supabase, user.id);
  if (!vendorId) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data: cat, error } = await supabase
    .from('categories')
    .insert({ 
      ...parsed.data, 
      vendor_id: vendorId 
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(cat, { status: 201 });
}
