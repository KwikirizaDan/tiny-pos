import { createClient } from "@/lib/supabase/server"

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "REFUND" | "ADJUSTMENT"

export async function logAuditEvent(params: {
  action: AuditAction
  tableName: string
  recordId?: string | null
  oldData?: string | null
  newData?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from("users")
    .select("vendor_id")
    .eq("auth_id", user.id)
    .single()

  if (!profile) return

  await supabase.from("audit_logs").insert({
    vendor_id: profile.vendor_id,
    user_id: user.id,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId,
    old_data: params.oldData,
    new_data: params.newData,
    ip_address: null,
  })
}
