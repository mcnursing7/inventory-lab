"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (!access_token || !refresh_token) {
          console.error("Missing tokens in URL");
          router.push("/login");
          return;
        }

        // ✅ Save session
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error || !data.session) {
          console.error("Auth error:", error?.message);
          router.push("/login");
          return;
        }

        // ✅ Check user status
        const user = data.session.user;

        if (!user.confirmed_at) {
          // 🚀 New invited user → needs to set password
          router.push("/set-password");
        } else {
          // 🚀 Existing user → go straight to dashboard
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        router.push("/login");
      }
    }

    handleAuthRedirect();
  }, [router]);

  return <p>Finishing sign in...</p>;
}
