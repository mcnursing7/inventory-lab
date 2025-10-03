"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthenticated(true);
      } else {
        router.push("/login"); // redirect if not logged in
      }
      setLoading(false);
    });

    // Optional: Listen for auth changes (logout, login)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.push("/login");
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) return <p className="text-center mt-10">Checking authentication...</p>;
  if (!authenticated) return null;

  return <>{children}</>;
}
