"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CSVLink } from "react-csv";

export default function StockValuationReportPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStockValuation() {
      const { data, error } = await supabase
        .from("v_stock_valuation") // view with item_id, item_name, sku, total_qty, unit_price, total_value
        .select("*");

      if (error) {
        console.error("Error fetching stock valuation:", error);
      } else {
        setItems(data || []);
      }
    }

    fetchStockValuation();
  }, []);

  const csvData = items.map((item) => ({
    Item: item.item_name,
    SKU: item.sku,
    "Total Qty": item.total_qty,
    "Unit Price": item.unit_price,
    "Total Value": item.total_value,
  }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Stock Valuation Report</h1>

      {items.length > 0 && (
        <CSVLink
          data={csvData}
          filename="stock_valuation_report.csv"
          className="inline-block mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Export CSV
        </CSVLink>
      )}

      {items.length === 0 ? (
        <p className="text-gray-600">✅ No inventory found.</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Item</th>
              <th className="border p-2">SKU</th>
              <th className="border p-2">Total Qty</th>
              <th className="border p-2">Unit Price</th>
              <th className="border p-2">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.item_id} className="hover:bg-gray-100">
                <td className="border p-2">{item.item_name}</td>
                <td className="border p-2">{item.sku}</td>
                <td className="border p-2">{item.total_qty}</td>
                <td className="border p-2">${item.unit_price?.toFixed(2)}</td>
                <td className="border p-2">${item.total_value?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
