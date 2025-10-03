"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function DeleteUserPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    fetchUser()
  }, [])

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (!email) {
      setMessage("❌ Please enter an email address")
      return
    }

    try {
      const res = await fetch("/api/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentUserId }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ User ${email} deleted successfully`)
        setEmail("")
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message || "Something went wrong"}`)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Delete User</h1>
      <form onSubmit={handleDelete} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email"
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500 transition"
        >
          Delete User
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  )
}
