import { createClient } from "@/lib/supabase/server";
import { resolveVendor } from "@/lib/vendor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["owner", "manager", "cashier"]).optional(),
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

  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { data: updated, error } = await supabase
    .from('users')
    .update({
      name: parsed.data.name,
      role: parsed.data.role,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .select()
    .single();

  if (error || !updated) return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vendor = await resolveVendor(supabase, user.id);
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .eq('vendor_id', vendor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
