"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Location = {
  id: string;
  name: string;
  created_at: string;
};

type Message = {
  text: string;
  type: "success" | "error";
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const showMessage = (msg: Message) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000); // auto-hide
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching locations:", error.message);
      showMessage({
        text: "❌ Error fetching locations: " + error.message,
        type: "error",
      });
    } else {
      setLocations(data || []);
    }
  };

  const addLocation = async () => {
    if (!newLocation.trim()) return;

    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          name: newLocation,
          organization_id:
            process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ||
            "00000000-0000-0000-0000-000000000001",
        },
      ])
      .select("*");

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      showMessage({
        text: "❌ Add location not allowed for this user. ",
        type: "error",
      });
    } else {
      setLocations((prev) => [...(data || []), ...prev]);
      setNewLocation("");
      showMessage({ text: "✅ Location added successfully!", type: "success" });
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    const { error } = await supabase.from("locations").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting location:", error.message);
      showMessage({
        text: "❌ Error deleting location: " + error.message,
        type: "error",
      });
      return;
    }

    // ✅ Give RLS time to rollback silently
    await new Promise((resolve) => setTimeout(resolve, 700));

    // ✅ Check if the record was truly deleted or blocked by RLS
    const { data: stillThere, error: checkError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", id);

    if (checkError) {
      console.error("❌ Error verifying delete:", checkError.message);
      showMessage({ text: "⚠️ Could not verify delete.", type: "error" });
      return;
    }

    if (stillThere && stillThere.length > 0) {
      // ✅ RLS blocked deletion
      showMessage({
        text: "🚫 Delete not allowed for this user.",
        type: "error",
      });
    } else {
      // ✅ Deletion succeeded
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      showMessage({
        text: "✅ Location deleted successfully!",
        type: "success",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Locations</h1>

      {/* Message */}
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

      {/* Add Location */}
      <div className="mb-4 p-4 border rounded-lg shadow bg-gray-100">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter new location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-100"
          />
          <button
            onClick={addLocation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>

      {/* Location List */}
      {locations.length === 0 ? (
        <p>No locations yet.</p>
      ) : (
        <ul className="space-y-2">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="p-3 border rounded-lg shadow-sm bg-white flex justify-between items-center"
            >
              <span>{loc.name}</span>
              <button
                onClick={() => deleteLocation(loc.id)}
                className="px-2 py-1 bg-blue-100 text-red rounded hover:bg-gray-200"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
