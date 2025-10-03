"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  // 🔹 Fetch the logged-in user's role from user_roles
  useEffect(() => {
    async function fetchRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (error) throw error;

          setRole(data?.role ?? null);
        } catch (err) {
          console.error("Error fetching user role:", err);
          setRole(null);
        }
      }
    }

    fetchRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 bg-blue-100 p-8 border-r flex flex-col">
          <h2 className="text-xl font-bold mb-6">MC SimLab Inventory</h2>
          <nav className="flex flex-col gap-1 flex-grow">
            <Link href="/dashboard" className="px-3 py-2 rounded hover:bg-blue-200">
              Dashboard
            </Link>
            <Link href="/dashboard/items" className="px-3 py-2 rounded hover:bg-blue-200">
              Items
            </Link>
            <Link href="/dashboard/inventory" className="px-3 py-2 rounded hover:bg-blue-200">
              Inventory
            </Link>
            <Link href="/dashboard/adjustments" className="px-3 py-2 rounded hover:bg-blue-200">
              Adjustments
            </Link>
            <Link href="/dashboard/purchase-orders" className="px-3 py-2 rounded hover:bg-blue-200">
              Purchase Orders
            </Link>
            <Link href="/dashboard/vendors" className="px-3 py-2 rounded hover:bg-blue-200">
              Vendors
            </Link>
            <Link href="/dashboard/locations" className="px-3 py-2 rounded hover:bg-blue-200">
              Locations
            </Link>
            <Link href="/dashboard/reports" className="px-3 py-2 rounded hover:bg-blue-200">
              Reports
            </Link>

            {/* 🔐 Restricted links for admin + manager only */}
            {(role === "admin" || role === "manager") && (
              <>
                <Link href="/dashboard/add-user" className="px-3 py-2 rounded hover:bg-blue-200">
                  Add User
                </Link>
                <Link href="/dashboard/delete-user" className="px-3 py-2 rounded hover:bg-blue-200">
                  Delete User
                </Link>
              </>
            )}
          </nav>

          {/* 🔹 Show logged-in role */}
          {role && (
            <div className="text-sm text-gray-700 mb-3">
              Signed in as: <span className="font-semibold">{role}</span>
            </div>
          )}

          {/* 🔴 Logout button */}
          <button
            onClick={handleLogout}
            className="mt-2 px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-400 transition"
          >
            Logout
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
