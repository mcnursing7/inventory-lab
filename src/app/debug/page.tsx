"use client"
import { supabase } from "@/lib/supabaseClient"
import { useEffect } from "react"

export default function DebugPage() {
  useEffect(() => {
    (async () => {
      try {
        console.log("🔍 DebugPage mounted, checking user...")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("❌ Error fetching user:", error)
        }

        if (!user) {
          console.warn("⚠️ No user found (maybe not logged in)")
        } else {
          console.log("✅ User object:", user)

          // Now also check their role
          const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("*")
            .eq("id", user.id)

          if (rolesError) {
            console.error("❌ Error fetching user_roles:", rolesError)
          } else {
            console.log("✅ user_roles row(s):", roles)
          }
        }
      } catch (err) {
        console.error("💥 Unexpected error:", err)
      }
    })()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Debug Page</h1>
      <p>Open the browser console to inspect user info and roles.</p>
    </div>
  )
}
