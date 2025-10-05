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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch logged-in user's role
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
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-blue-100 p-6 border-r flex flex-col w-60 transform transition-transform duration-300
          fixed md:static inset-y-0 left-0 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <h2 className="text-xl font-bold mb-6">MC SimLab Inventory</h2>
          <nav className="flex flex-col gap-1 flex-grow">
            <Link href="/dashboard" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Dashboard
            </Link>
            <Link href="/dashboard/items" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Items
            </Link>
            <Link href="/dashboard/inventory" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Inventory
            </Link>
            <Link href="/dashboard/adjustments" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Adjustments
            </Link>
            <Link href="/dashboard/purchase-orders" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Purchase Orders
            </Link>
            <Link href="/dashboard/vendors" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Vendors
            </Link>
            <Link href="/dashboard/locations" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Locations
            </Link>
            <Link href="/dashboard/reports" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
              Reports
            </Link>

            {(role === "admin" || role === "manager") && (
              <>
                <Link href="/dashboard/add-user" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
                  Add User
                </Link>
                <Link href="/dashboard/delete-user" className="px-3 py-2 rounded hover:bg-blue-200" onClick={() => setSidebarOpen(false)}>
                  Delete User
                </Link>
              </>
            )}
          </nav>

          {role && (
            <div className="text-sm text-gray-700 mb-3">
              Signed in as: <span className="font-semibold">{role}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="mt-2 px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-400 transition"
          >
            Logout
          </button>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 bg-white border-b p-3 flex items-center md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 text-2xl mr-3"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
