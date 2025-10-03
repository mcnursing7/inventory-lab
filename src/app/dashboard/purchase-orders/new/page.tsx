"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BarcodeScanner from "@/components/BarcodeScanner";

type Vendor = { id: string; name: string };
type Item = { id: string; name: string; sku: string | null; barcode: string | null };
type POLine = { item: Item; qty: number; price: number };

export default function NewPOPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [poLines, setPOLines] = useState<POLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load vendors and items
  useEffect(() => {
    const fetchData = async () => {
      const [vendorRes, itemRes] = await Promise.all([
        supabase.from("vendors").select("*"),
        supabase.from("items").select("id, name, sku, barcode"),
      ]);
      setVendors(vendorRes.data ?? []);
      setItems(itemRes.data ?? []);
    };
    fetchData();
  }, []);

  // Filter items for search input
  const filteredItems = items.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.sku?.toLowerCase().includes(q) ||
      i.barcode?.toLowerCase().includes(q)
    );
  });

  // Add item to PO lines
  const addItem = (item: Item) => {
    if (!poLines.some((line) => line.item.id === item.id)) {
      setPOLines([...poLines, { item, qty: 1, price: 0 }]);
      setSearch("");
      setScanActive(false);
    }
  };

  // Remove item from PO lines
  const removeItem = (itemId: string) => {
    setPOLines(poLines.filter((line) => line.item.id !== itemId));
  };

  const totalPrice = poLines.reduce((acc, line) => acc + line.qty * line.price, 0);

  // Create PO
  const handleSubmit = async () => {
    if (!selectedVendor || poLines.length === 0) return;
    setSubmitting(true);

    try {
      // 1. Get next PO number
      const { data: lastPO } = await supabase
        .from("purchase_orders")
        .select("po_number")
        .order("po_number", { ascending: false })
        .limit(1)
        .single();
      const nextNumber = lastPO?.po_number ? lastPO.po_number + 1 : 1;

      // 2. Insert PO
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert([{
          po_number: nextNumber,
          status: "draft",
          vendor_id: selectedVendor,
          organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID
        }])
        .select()
        .single();

      if (poError || !poData) {
        console.error("PO insert error:", poError);
        throw poError || new Error("PO insert failed");
      }

      // 3. Insert PO lines
      const linesToInsert = poLines.map((line) => ({
        po_id: poData.id,
        item_id: line.item.id,
        qty_ordered: line.qty,
        price: line.price,
        organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID
      }));

      const { error: lineError } = await supabase
        .from("purchase_order_lines")
        .insert(linesToInsert);

      if (lineError) {
        console.error("PO lines insert error:", lineError);
        throw lineError;
      }

      alert(`PO- ${poData.po_number} created successfully!`);
      setPOLines([]);
      setSelectedVendor("");
    } catch (err) {
      console.error("Error creating PO:", err);
      alert("Failed to create PO");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">New Purchase Order</h1>

      {/* Vendor selection */}
      <div>
        <label className="block mb-1">Vendor</label>
        <select
          className="border p-2 rounded w-full"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          <option value="">Select vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search + Scan input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Search or scan item"
          className="border p-2 rounded flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setScanActive((s) => !s)}
          className="px-3 py-2 rounded bg-indigo-600 text-white"
        >
          {scanActive ? "Stop Scan" : "Scan"}
        </button>
      </div>

      {/* BarcodeScanner mounts only when active */}
      <BarcodeScanner
        active={scanActive}
        onScan={(code) => {
          const match = items.find((i) => i.barcode === code);
          if (match) addItem(match);
          setSearch(code);
          setScanActive(false);
        }}
      />

      {/* Filtered item list */}
      {filteredItems.length > 0 && (
        <div className="border rounded max-h-40 overflow-y-auto p-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-1 cursor-pointer hover:bg-gray-100"
              onClick={() => addItem(item)}
            >
              {item.name} {item.sku && `(${item.sku})`}
            </div>
          ))}
        </div>
      )}

      {/* PO lines table */}
      {poLines.length > 0 && (
        <div className="overflow-x-auto border rounded mt-2">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Item</th>
                <th className="p-2 border text-left">SKU</th>
                <th className="p-2 border text-right">Qty</th>
                <th className="p-2 border text-right">Price</th>
                <th className="p-2 border text-right">Subtotal</th>
                <th className="p-2 border text-left">Remove</th>
              </tr>
            </thead>
            <tbody>
              {poLines.map((line) => (
                <tr key={line.item.id}>
                  <td className="p-2 border">{line.item.name}</td>
                  <td className="p-2 border">{line.item.sku ?? "-"}</td>
                  <td className="p-2 border text-right">
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      className="w-16 border p-1 rounded text-right"
                      onChange={(e) =>
                        setPOLines(
                          poLines.map((l) =>
                            l.item.id === line.item.id
                              ? { ...l, qty: Number(e.target.value) }
                              : l
                          )
                        )
                      }
                    />
                  </td>
                  <td className="p-2 border text-right">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.price}
                      className="w-20 border p-1 rounded text-right"
                      onChange={(e) =>
                        setPOLines(
                          poLines.map((l) =>
                            l.item.id === line.item.id
                              ? { ...l, price: Number(e.target.value) }
                              : l
                          )
                        )
                      }
                    />
                  </td>
                  <td className="p-2 border text-right">
                    {(line.qty * line.price).toFixed(2)}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      className="text-red-500"
                      onClick={() => removeItem(line.item.id)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-2 font-bold">
            Total: ${totalPrice.toFixed(2)}
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !selectedVendor || poLines.length === 0}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4 disabled:bg-gray-400"
      >
        {submitting ? "Submitting..." : "Create PO"}
      </button>
    </div>
  );
}
