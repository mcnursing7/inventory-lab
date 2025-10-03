"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BarcodeScanner from "@/components/BarcodeScanner";

type Item = { id: string; name: string; sku: string | null; barcode: string | null };
type Location = { id: string; name: string };
type POLine = {
  id: string;
  item_id: string;
  qty_ordered: number;
  qty_received: number;
  pending: number;
  receiveQty: number;
  price: number | null;
  item: Item;
  location_id?: string;
};

export default function ReceivePOPage() {
  const { id: poId } = useParams();
  const router = useRouter();
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID!;

  const [poLines, setPOLines] = useState<POLine[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [scanActive, setScanActive] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);

  // Load PO lines and locations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [{ data: linesData }, { data: locData }] = await Promise.all([
          supabase
            .from("purchase_order_lines")
            .select("*, items(id, name, sku, barcode)")
            .eq("po_id", poId),
          supabase
            .from("locations")
            .select("*")
            .eq("organization_id", orgId),
        ]);

        const mappedLines = (linesData ?? []).map((line: any) => ({
          ...line,
          qty_ordered: Number(line.qty_ordered),
          qty_received: Number(line.qty_received ?? 0),
          pending: Number(line.qty_ordered) - Number(line.qty_received ?? 0),
          receiveQty: 0,
          item: line.items,
        }));

        setPOLines(mappedLines);
        setLocations(locData ?? []);
      } catch (err) {
        console.error("Error loading PO lines or locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poId, orgId]);

  // Barcode search
  const filteredLines = poLines.filter((line) => {
    const q = search.toLowerCase();
    return (
      line.item.name.toLowerCase().includes(q) ||
      line.item.sku?.toLowerCase().includes(q) ||
      line.item.barcode?.toLowerCase().includes(q)
    );
  });

  const handleReceive = async () => {
    setReceiving(true);
    try {
      for (const line of poLines) {
        if (!line.item || line.receiveQty <= 0) continue;
        const locationId = line.location_id || locations[0]?.id;
        if (!locationId) continue;

        const { error } = await supabase.from("adjustments").insert([
          {
            organization_id: orgId,
            item_id: line.item_id,
            location_id: locationId,
            change: line.receiveQty,
            reason: "receive",
            po_id: poId,
            po_line_id: line.id,
          },
        ]);

        if (error) throw error;
      }

      alert("Items successfully received!");
      router.refresh();
    } catch (err) {
      console.error("Error receiving items:", err);
      alert("Failed to receive items.");
    } finally {
      setReceiving(false);
    }
  };

  const updateReceiveQty = (lineId: string, value: number) => {
    setPOLines((prev) =>
      prev.map((line) => {
        if (line.id === lineId) {
          const qty = Math.min(Math.max(value, 0), line.pending);
          return { ...line, receiveQty: qty };
        }
        return line;
      })
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Receive PO</h1>

      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          placeholder="Search by item, SKU, or barcode"
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setScanActive((s) => !s)}
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          {scanActive ? "Stop Scan" : "Scan"}
        </button>
      </div>

      <BarcodeScanner
        active={scanActive}
        onScan={(code) => {
          setSearch(code);
          setScanActive(false);
        }}
      />

      {loading && <p className="text-gray-500 text-sm">Loading PO lines…</p>}

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Item</th>
            <th className="border p-2 text-left">SKU</th>
            <th className="border p-2 text-left">Barcode</th>
            <th className="border p-2 text-right">Ordered</th>
            <th className="border p-2 text-right">Received</th>
            <th className="border p-2 text-right">Pending</th>
            <th className="border p-2 text-right">Receive Qty</th>
            <th className="border p-2 text-left">Location</th>
          </tr>
        </thead>
        <tbody>
          {filteredLines.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                No items found.
              </td>
            </tr>
          )}

          {filteredLines.map((line) => (
            <tr key={line.id} className="hover:bg-gray-100">
              <td className="border p-2">{line.item.name}</td>
              <td className="border p-2">{line.item.sku}</td>
              <td className="border p-2">{line.item.barcode}</td>
              <td className="border p-2 text-right">{line.qty_ordered}</td>
              <td className="border p-2 text-right">{line.qty_received}</td>
              <td className="border p-2 text-right">{line.pending}</td>
              <td className="border p-2 text-right">
                <input
                  type="number"
                  min={0}
                  max={line.pending}
                  value={line.receiveQty}
                  onChange={(e) =>
                    updateReceiveQty(line.id, Number(e.target.value))
                  }
                  className="w-20 border rounded p-1 text-right"
                />
              </td>
              <td className="border p-2">
                <select
                  className="border p-1 rounded w-full"
                  onChange={(e) =>
                    setPOLines((prev) =>
                      prev.map((l) =>
                        l.id === line.id ? { ...l, location_id: e.target.value } : l
                      )
                    )
                  }
                  value={line.location_id || locations[0]?.id || ""}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleReceive}
        disabled={receiving || poLines.every((l) => l.receiveQty <= 0)}
        className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
      >
        {receiving ? "Receiving..." : "Receive Items"}
      </button>
    </div>
  );
}
