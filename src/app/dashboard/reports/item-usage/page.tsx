"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CSVLink } from "react-csv";

export default function ItemUsageReportPage() {
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch locations for filter dropdown
  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error) setLocations(data || []);
    }

    fetchLocations();
  }, []);

  // Fetch item usage based on filters
  useEffect(() => {
    async function fetchItemUsage() {
      let query = supabase
        .from("v_item_usage")
        .select("item_id, item_name, sku, total_used, location_name")
        .order("item_name", { ascending: true });

      if (selectedLocation) {
        query = query.eq("location_id", selectedLocation);
      }
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching item usage:", error);
      } else {
        setItems(data || []);
      }
    }

    fetchItemUsage();
  }, [selectedLocation, startDate, endDate]);

  const csvHeaders = [
    { label: "Item Name", key: "item_name" },
    { label: "SKU", key: "sku" },
    { label: "Location", key: "location_name" },
    { label: "Total Used", key: "total_used" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Item Usage Report</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-semibold">Location:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
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

      {items.length === 0 ? (
        <p className="text-gray-600">✅ No item usage recorded.</p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <CSVLink
              data={items}
              headers={csvHeaders}
              filename="item_usage_report.csv"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Export CSV
            </CSVLink>
          </div>

          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Item Name</th>
                <th className="border p-2">SKU</th>
                <th className="border p-2">Location</th>
                <th className="border p-2">Total Used</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.item_id}-${item.location_name}`} className="hover:bg-gray-100">
                  <td className="border p-2">{item.item_name}</td>
                  <td className="border p-2">{item.sku}</td>
                  <td className="border p-2">{item.location_name || "N/A"}</td>
                  <td className="border p-2">{item.total_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
