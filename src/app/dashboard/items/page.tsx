"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BarcodeScanner from "@/components/BarcodeScanner";

type Item = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  min_stock: number;
  max_stock: number;
  price: number | null;
  created_at: string;
};

type Message = {
  text: string;
  type: "success" | "error";
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [minStock, setMinStock] = useState(0);
  const [maxStock, setMaxStock] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // 🔔 Auto-hide messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage({ text: "❌ Error fetching items.", type: "error" });
    } else {
      setItems(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (minStock > maxStock) {
      setMessage({ text: "❌ Min Stock cannot be greater than Max Stock", type: "error" });
      return;
    }

    const itemData = {
      sku,
      barcode: barcode || null,
      name,
      min_stock: minStock,
      max_stock: maxStock,
      price: price === "" ? null : price,
    };

    if (editingId) {
      const { error } = await supabase.from("items").update(itemData).eq("id", editingId);

      if (error) {
        console.error(error);
        setMessage({ text: "❌ Update failed: " + error.message, type: "error" });
      } else {
        resetForm();
        fetchItems();
        setMessage({ text: "✅ Item updated successfully!", type: "success" });
      }
    } else {
      const { error } = await supabase.from("items").insert([itemData]);

      if (error) {
        console.error(error);
        setMessage({ text: "❌ Insert failed: " + error.message, type: "error" });
      } else {
        resetForm();
        fetchItems();
        setMessage({ text: "✅ Item added successfully!", type: "success" });
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("items").delete().eq("id", id);

    // Delay check for RLS block or async delete rollback
    await new Promise((res) => setTimeout(res, 500));

    const { data: check } = await supabase.from("items").select("id").eq("id", id);

    if (error || (check && check.length > 0)) {
      console.error("❌ Delete blocked or failed:", error?.message);
      setMessage({ text: "❌ This user cannot delete.", type: "error" });
    } else {
      fetchItems();
      setMessage({ text: "✅ Item deleted successfully!", type: "success" });
    }
  }

  function handleEdit(item: Item) {
    setEditingId(item.id);
    setSku(item.sku || "");
    setBarcode(item.barcode || "");
    setName(item.name);
    setPrice(item.price ?? "");
    setMinStock(item.min_stock);
    setMaxStock(item.max_stock);
  }

  function resetForm() {
    setSku("");
    setBarcode("");
    setName("");
    setPrice("");
    setMinStock(0);
    setMaxStock(0);
    setEditingId(null);
  }

  const filtered = items.filter(
    (item) =>
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Items</h1>

      {/* 🔔 Message Banner */}
      {message && (
        <div
          className={`mb-4 p-2 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search + Scanner */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by SKU, Barcode, or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={() => setScanning((prev) => !prev)}
          className="bg-blue-500 text-white px-4 rounded"
        >
          {scanning ? "Stop Scan" : "Start Scan"}
        </button>
      </div>

      <BarcodeScanner
        active={scanning}
        onScan={(text) => {
          setSearch(text);
          setScanning(false);
        }}
      />

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Barcode (optional)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Min Stock"
          value={minStock}
          onChange={(e) => setMinStock(Number(e.target.value))}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          placeholder="Max Stock"
          value={maxStock}
          onChange={(e) => setMaxStock(Number(e.target.value))}
          className="border p-2 rounded w-full"
          required
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            {editingId ? "Update Item" : "Add Item"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Item List */}
      <table className="w-full border">
        <thead>
          <tr className="bg-blue-100">
            <th className="p-2 border">SKU</th>
            <th className="p-2 border">Barcode</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Min Stock</th>
            <th className="p-2 border">Max Stock</th>
            <th className="p-2 border">Created At</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td className="p-2 border">{item.sku}</td>
              <td className="p-2 border">{item.barcode || "-"}</td>
              <td className="p-2 border">{item.name}</td>
              <td className="p-2 border">
                {item.price != null ? `$${item.price.toFixed(2)}` : "-"}
              </td>
              <td className="p-2 border">{item.min_stock}</td>
              <td className="p-2 border">{item.max_stock}</td>
              <td className="p-2 border">
                {new Date(item.created_at).toLocaleString()}
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-green-900 text-red px-4 py-1 rounded"
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
