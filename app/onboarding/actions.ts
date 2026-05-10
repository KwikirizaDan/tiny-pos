"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

const schema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().default("UGX"),
})

export async function createStore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const str = (key: string) => {
    const v = formData.get(key)
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined
  }

  const parsed = schema.safeParse({
    storeName: str("storeName"),
    slug: str("slug"),
    phone: str("phone"),
    address: str("address"),
    currency: str("currency") ?? "UGX",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { storeName, slug, phone, address, currency } = parsed.data

  const { error: rpcError } = await supabase.rpc("create_vendor_for_user", {
    p_name: storeName,
    p_slug: slug,
    p_phone: phone ?? null,
    p_address: address ?? null,
    p_currency: currency,
  })

  if (rpcError) {
    if (rpcError.message.includes("SLUG_TAKEN")) {
      return { error: "That store URL is already taken. Try another." }
    }
    return { error: rpcError.message }
  }

  redirect("/dashboard")
}
