import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingClient } from "@/components/onboarding/onboarding-client"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  // Already has a vendor — skip onboarding
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (vendor) redirect("/dashboard")

  return <OnboardingClient />
}
