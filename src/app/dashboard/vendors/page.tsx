"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Vendor = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID!

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vendors:", error.message)
    } else {
      setVendors(data || [])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from("vendors").insert([
      {
        organization_id: orgId,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      },
    ])

    if (error) {
      alert("Error creating vendor: " + error.message)
    } else {
      setName("")
      setEmail("")
      setPhone("")
      setAddress("")
      setNotes("")
      fetchVendors()
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Vendors</h1>

      {/* Add Vendor Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Vendor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Saving..." : "Add Vendor"}
        </button>
      </form>

      {/* Vendor List */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Address</th>
            <th className="p-2 border">Notes</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="border-t">
              <td className="p-2 border">{vendor.name}</td>
              <td className="p-2 border">{vendor.email || "-"}</td>
              <td className="p-2 border">{vendor.phone || "-"}</td>
              <td className="p-2 border">{vendor.address || "-"}</td>
              <td className="p-2 border">{vendor.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
