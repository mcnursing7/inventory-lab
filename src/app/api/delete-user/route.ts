import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔑 service role key (server only)
)

export async function DELETE(req: Request) {
  try {
    const { email, currentUserId } = await req.json()

    if (!email || !currentUserId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // ✅ Check current user's role
    const { data: currentRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("id", currentUserId)
      .single()

    if (roleError || !currentRole) {
      return NextResponse.json({ error: "Could not verify current user role" }, { status: 403 })
    }

    const currentUserRole = currentRole.role

    // ✅ Get target user info
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("user_roles")
      .select("id, role")
      .eq("id", (await getUserIdByEmail(email)))
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    // 🚫 Prevent deleting self
    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 403 })
    }

    // 🚫 Apply role rules
    if (currentUserRole === "lab_user") {
      return NextResponse.json({ error: "Lab users cannot delete users" }, { status: 403 })
    }

    if (currentUserRole === "manager" && targetUser.role === "admin") {
      return NextResponse.json({ error: "Managers cannot delete admins" }, { status: 403 })
    }

    // ✅ Find target auth user by email
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const targetAuthUser = userList.users.find((u) => u.email === email)
    if (!targetAuthUser) {
      return NextResponse.json({ error: "Auth user not found" }, { status: 404 })
    }

    // ✅ Delete from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetAuthUser.id)
    if (deleteError) throw deleteError

    // ✅ Clean up from user_roles
    await supabaseAdmin.from("user_roles").delete().eq("id", targetUser.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 })
  }
}

// 🔎 Helper: get user id from email
async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return null
  const user = data.users.find((u) => u.email === email)
  return user ? user.id : null
}
