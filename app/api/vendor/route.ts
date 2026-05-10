import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ 
  name: z.string().min(1), 
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/) 
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  return NextResponse.json(vendor ?? null);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { data: existing } = await supabase
    .from('vendors')
    .select('id')
    .eq('slug', parsed.data.slug)
    .single();

  if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });

  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({ 
      ...parsed.data, 
      owner_id: user.id 
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(vendor, { status: 201 });
}
