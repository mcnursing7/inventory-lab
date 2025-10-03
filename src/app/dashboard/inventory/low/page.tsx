"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Item {
  id: string;
  sku: string;
  name: string;
  min_stock: number;
  max_stock: number;
}

interface InventoryRow {
  id: string;
  qty: number;
  updated_at: string;
  item_id: string;
  item: Item | null;
}

export default function LowInventoryReport() {
  const [lowInventory, setLowInventory] = useState<InventoryRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔄 Fetching low inventory report...");

      const { data: invData, error } = await supabase
        .from("inventory")
        .select(
          `
          id,
          qty,
          updated_at,
          item_id,
          items (
            id,
            sku,
            name,
            min_stock,
            max_stock
          )
        `
        );

      if (error) {
        console.error("❌ Error fetching inventory:", error);
        return;
      }

      const mapped: InventoryRow[] =
        invData?.map((row: any) => ({
          id: row.id,
          qty: row.qty,
          updated_at: row.updated_at,
          item_id: row.item_id,
          item: row.items ?? null,
        })) ?? [];

      // filter only low inventory
      const low = mapped.filter(
        (inv) => inv.item && inv.qty < inv.item.min_stock
      );

      setLowInventory(low);
    };

    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Low Inventory Report</h1>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        🖨️ Print Report
      </button>

      {lowInventory.length === 0 ? (
        <p className="text-gray-600">✅ No low inventory items!</p>
      ) : (
        <table className="w-full border border-gray-300 print:border-none">
          <thead className="bg-gray-100 print:bg-white">
            <tr>
              <th className="border p-2">Item</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Min Stock</th>
              <th className="border p-2">Max Stock</th>
              <th className="border p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {lowInventory.map((inv) => (
              <tr key={inv.id} className="bg-red-50 print:bg-white">
                <td className="border p-2">{inv.item?.name ?? "Unknown"}</td>
                <td className="border p-2">{inv.qty}</td>
                <td className="border p-2">{inv.item?.min_stock}</td>
                <td className="border p-2">{inv.item?.max_stock}</td>
                <td className="border p-2">
                  {new Date(inv.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
