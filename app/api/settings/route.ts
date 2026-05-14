import { createClient } from "@/lib/supabase/server";
import { resolveVendor } from "@/lib/vendor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data, error } = await supabase
    .from('vendor_settings')
    .select('*')
    .eq('vendor_id', vendor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
  return NextResponse.json(map);
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

  const { data: existing } = await supabase
    .from('vendor_settings')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('key', parsed.data.key)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('vendor_settings')
      .update({ value: parsed.data.value, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendor.id)
      .eq('key', parsed.data.key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('vendor_settings')
      .insert({ ...parsed.data, vendor_id: vendor.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
