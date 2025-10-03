"use client";

import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-800">
        Reports
      </h1>
      <p className="text-gray-600">
        Select a report to view detailed insights about inventory and usage.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Low Inventory Report */}
        <Link
          href="/dashboard/reports/low-stock"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Low Inventory</h2>
          <p className="text-gray-600 text-sm">
            Items below minimum stock levels across all locations.
          </p>
        </Link>

        {/* Item Usage Report */}
        <Link
          href="/dashboard/reports/item-usage"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Item Usage</h2>
          <p className="text-gray-600 text-sm">
            Track inventory usage over time per location and item.
          </p>
        </Link>

        {/* Stock Valuation Report */}
        <Link
          href="/dashboard/reports/stock-valuation"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Stock Valuation</h2>
          <p className="text-gray-600 text-sm">
            View the total value of inventory per item and location.
          </p>
        </Link>

        {/* Recent Adjustments Report */}
        <Link
          href="/dashboard/reports/recent-adjustments"
          className="bg-blue-100 p-6 rounded-lg shadow hover:bg-blue-200 transition"
        >
          <h2 className="text-lg font-semibold text-blue-700">Recent Adjustments</h2>
          <p className="text-gray-600 text-sm">
            See all inventory adjustments such as receive, usage, and corrections.
          </p>
        </Link>
      </div>
    </div>
  );
}
