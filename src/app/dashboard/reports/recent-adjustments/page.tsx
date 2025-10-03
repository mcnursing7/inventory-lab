"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CSVLink } from "react-csv";

const REASONS = ["receive", "usage", "wastage", "correction"];

export default function RecentAdjustmentsReportPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [filterReason, setFilterReason] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    async function fetchAdjustments() {
      let query = supabase
        .from("adjustments")
        .select("*, items(name, sku), locations(name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filterReason) query = query.eq("reason", filterReason);
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching adjustments:", error);
      } else {
        setAdjustments(data || []);
      }
    }

    fetchAdjustments();
  }, [filterReason, startDate, endDate]);

  // Prepare CSV data
  const csvData = adjustments.map((adj) => ({
    Item: adj.items?.name,
    SKU: adj.items?.sku,
    Change: adj.change,
    Reason: adj.reason,
    Location: adj.locations?.name,
    Date: new Date(adj.created_at).toLocaleString(),
  }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Recent Adjustments Report</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-semibold">Reason:</label>
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="mr-2 font-semibold">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* CSV Export Button */}
      {adjustments.length > 0 && (
        <CSVLink
          data={csvData}
          filename="recent_adjustments_report.csv"
          className="inline-block mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Export CSV
        </CSVLink>
      )}

      {/* Adjustments Table */}
      {adjustments.length === 0 ? (
        <p className="text-gray-600">✅ No adjustments found for this filter.</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Item</th>
              <th className="border p-2">SKU</th>
              <th className="border p-2">Change</th>
              <th className="border p-2">Reason</th>
              <th className="border p-2">Location</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((adj) => (
              <tr key={adj.id} className="hover:bg-gray-100">
                <td className="border p-2">{adj.items?.name}</td>
                <td className="border p-2">{adj.items?.sku}</td>
                <td className="border p-2">{adj.change}</td>
                <td className="border p-2">{adj.reason}</td>
                <td className="border p-2">{adj.locations?.name}</td>
                <td className="border p-2">
                  {new Date(adj.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
