"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PoDetailsPage() {
  const { id: poId } = useParams();
  const router = useRouter();
  const [po, setPo] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // ✅ Fetch PO details
  async function fetchPO() {
    // PO + vendor
    const { data: poData } = await supabase
      .from("v_purchase_orders")
      .select("*, vendors(name)")
      .eq("id", poId)
      .single();

    // Line items
    const { data: lineData } = await supabase
      .from("purchase_order_lines")
      .select("*, items(name, sku, barcode)")
      .eq("po_id", poId);

    setPo(poData);
    setLines(lineData || []);
  }

  // ✅ Fetch adjustments
  async function fetchAdjustments() {
    const { data } = await supabase
      .from("adjustments")
      .select("*, items(name, sku, barcode), locations(name)")
      .eq("po_id", poId)
      .order("created_at", { ascending: false });
    setAdjustments(data || []);
  }

  // ✅ Approve PO
  async function approvePO() {
    await supabase
      .from("purchase_orders")
      .update({ status: "open" })
      .eq("id", poId);
    await fetchPO();
    router.refresh();
  }

  // ✅ Close PO
  async function closePO() {
    await supabase
      .from("purchase_orders")
      .update({ status: "closed" })
      .eq("id", poId);
    await fetchPO();
    router.refresh();
  }

  useEffect(() => {
    fetchPO();
    fetchAdjustments();
  }, [poId]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl font-bold">PO Details: {po?.po_number}</h1>
        <div className="flex gap-2">
          {po?.status === "draft" && (
            <button
              onClick={approvePO}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Approve PO
            </button>
          )}
          {po?.status === "open" && (
            <button
              onClick={closePO}
              className="px-4 py-2 rounded bg-green-800 text-white hover:bg-green-700"
            >
              Close PO
            </button>
          )}
          <button
            onClick={() =>
              router.push(`/dashboard/purchase-orders/${poId}/receive`)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-indigo-700"
          >
            Receive Items
          </button>
        </div>
      </div>

      <div className="mb-4 border rounded p-4 bg-gray-50">
        <p>
          <span className="font-semibold">Vendor:</span> {po?.vendors?.name ?? "Unknown"}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {po?.computed_status}
        </p>
        <p>
          <span className="font-semibold">Created At:</span>{" "}
          {new Date(po?.created_at).toLocaleString()}
        </p>
        <p>
          <span className="font-semibold">Total Ordered:</span> {po?.total_ordered}
        </p>
        <p>
          <span className="font-semibold">Total Received:</span> {po?.total_received}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-2">PO Line Items</h2>
      <table className="w-full border-collapse border mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Item</th>
            <th className="border p-2">SKU</th>
            <th className="border p-2">Barcode</th>
            <th className="border p-2">Ordered</th>
            <th className="border p-2">Received</th>
            <th className="border p-2">Pending</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const pending = line.qty_ordered - (line.qty_received || 0);
            return (
              <tr key={line.id} className="hover:bg-gray-100">
                <td className="border p-2">{line.items.name}</td>
                <td className="border p-2">{line.items.sku}</td>
                <td className="border p-2">{line.items.barcode}</td>
                <td className="border p-2">{line.qty_ordered}</td>
                <td className="border p-2">{line.qty_received || 0}</td>
                <td className="border p-2">{pending}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2
        className="text-xl font-semibold mb-2 flex items-center gap-2 cursor-pointer"
        onClick={() => setShowAdjustments((s) => !s)}
      >
        Adjustment History
        <span className="text-sm text-indigo-600">{showAdjustments ? "▼" : "►"}</span>
      </h2>

      {showAdjustments && (
        <table className="w-full border-collapse border mb-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Item</th>
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
