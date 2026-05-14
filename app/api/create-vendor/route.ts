import { createClient } from "@/lib/supabase/server";
import { createDefaultVendor } from "@/lib/auto-vendor";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const vendor = await createDefaultVendor(user.id);
    return NextResponse.json(vendor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
