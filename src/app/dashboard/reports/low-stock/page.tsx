"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CSVLink } from "react-csv";

interface LowStockItem {
  item_id: string;
  name: string;
  sku: string;
  total_qty: number;
  min_stock: number;
}

export default function LowStockReportPage() {
  const [items, setItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    async function fetchLowStock() {
      const { data, error } = await supabase
        .from("v_low_stock_items_agg")
        .select("item_id, name, sku, total_qty, min_stock")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching low stock:", error);
      } else {
        setItems(data || []);
      }
    }

    fetchLowStock();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Low Stock Report</h1>

      {items.length > 0 && (
        <div className="mb-4">
          <CSVLink
            data={items}
            headers={[
              { label: "Item Name", key: "name" },
              { label: "SKU", key: "sku" },
              { label: "Total Quantity", key: "total_qty" },
              { label: "Minimum Stock", key: "min_stock" },
            ]}
            filename={`low_stock_report.csv`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export CSV
          </CSVLink>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-600">✅ No low stock items right now.</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Item</th>
              <th className="border p-2">SKU</th>
              <th className="border p-2">Total Qty</th>
              <th className="border p-2">Min Stock</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.item_id} className="hover:bg-gray-100">
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">{item.sku}</td>
                <td className="border p-2">{item.total_qty}</td>
                <td className="border p-2">{item.min_stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
