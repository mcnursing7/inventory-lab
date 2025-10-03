"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard"; // ✅ import wrapper

function DashboardPageContent() {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLowStock() {
      const { data, error } = await supabase
        .from("v_low_stock_items_agg")
        .select("item_id, name, sku, total_qty, min_stock")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching low stock:", error);
      } else {
        setLowStockItems(data || []);
      }
    }

    fetchLowStock();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* 🔴 Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-gray-100 border border-gray-50 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">⚠️ Low Stock Alert</strong>
          <p className="mt-1">
            {lowStockItems.length} item(s) are below minimum stock levels.
          </p>
          <Link
            href="/dashboard/reports/low-stock"
            className="mt-2 inline-block bg-red-50 px-3 py-1 rounded text-red-700 hover:bg-red-100 transition"
          >
            View Low Stock Report →
          </Link>
        </div>
      )}

      {/* Welcome Section */}
      <h1 className="text-3xl font-bold text-blue-800 text-center font-sans">
        Welcome to MC SimLab Inventory
      </h1>
      <p className="text-gray-600">
        Use the buttons below to quickly navigate to different sections.
      </p>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <Link
          href="/dashboard/items"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Items</h2>
          <p className="text-gray-600 text-sm">Manage all inventory items</p>
        </Link>

        <Link
          href="/dashboard/inventory"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Inventory</h2>
          <p className="text-gray-600 text-sm">Track stock across locations</p>
        </Link>

        <Link
          href="/dashboard/purchase-orders"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Purchase Orders</h2>
          <p className="text-gray-600 text-sm">Create and manage POs</p>
        </Link>

        <Link
          href="/dashboard/vendors"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Vendors</h2>
          <p className="text-gray-600 text-sm">Manage suppliers</p>
        </Link>

        <Link
          href="/dashboard/locations"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Locations</h2>
          <p className="text-gray-600 text-sm">Track storage locations</p>
        </Link>

        <Link
          href="/dashboard/reports"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Reports</h2>
          <p className="text-gray-600 text-sm">View insights & stock alerts</p>
        </Link>

        <Link
          href="/dashboard/adjustments"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Adjustments</h2>
          <p className="text-gray-600 text-sm">Make stock changes</p>
        </Link>
      </div>
    </div>
  );
}

// ✅ Export with AuthGuard
export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  );
}
