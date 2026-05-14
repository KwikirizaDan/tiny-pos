"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/pos";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      setUser(data);
      setLoading(false);
    }

    getUser();
  }, []);

  return { user, loading };
}
