"use client";

import { useState } from "react";

export default function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("lab_user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to invite user");

      setMessage(`✅ Invitation sent to ${email}`);
      setEmail("");
      setRole("lab_user");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleInvite}
      className="max-w-md p-4 border rounded-xl shadow-sm space-y-4 bg-white"
    >
      <h2 className="text-xl font-bold">Invite New User</h2>

      <div>
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        >
          <option value="lab_user">Lab User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Inviting..." : "Send Invitation"}
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </form>
  );
}
