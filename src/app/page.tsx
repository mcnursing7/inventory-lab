import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function Home() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is logged in → go to dashboard
    redirect("/dashboard");
  } else {
    // User not logged in → go to login
    redirect("/login");
  }
}
