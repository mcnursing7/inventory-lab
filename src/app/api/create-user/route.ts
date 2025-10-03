import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    console.log("Inviting:", email, "as role:", role);

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: "http://localhost:3000/set-password", // 🔹 ensures invite goes to password set page
      });

    if (inviteError) throw inviteError;

    const userId = inviteData.user?.id;
    if (!userId) throw new Error("Failed to retrieve user ID");

    console.log("New user ID:", userId);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ id: userId, role });

    if (roleError) throw roleError;

    return NextResponse.json({ message: "Invitation sent successfully" });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
