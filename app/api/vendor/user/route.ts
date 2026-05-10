import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vendorId, email, name } = await req.json();
  
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (existing) return NextResponse.json(existing);

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id: authUser.id,
      vendor_id: vendorId,
      email,
      name,
      role: "owner"
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json(newUser, { status: 201 });
}
