import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    );
  }

  redirect("/dashboard");
}