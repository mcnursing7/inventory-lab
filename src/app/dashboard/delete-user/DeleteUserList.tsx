"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type UserProfile = {
  id: string
  email: string
  role: string
}

export default function DeleteUserList() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      // ✅ Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // ✅ Fetch from user_roles instead of profiles
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, role, auth_users!inner(email)")

      if (!error && data) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          email: row.auth_users.email,
          role: row.role,
        }))
        setUsers(mapped as UserProfile[])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  const handleDelete = async (user: UserProfile) => {
    setMessage("")

    if (user.id === currentUserId) {
      setMessage("❌ Cannot delete yourself")
      return
    }

    try {
      const res = await fetch("/api/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, currentUserId }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete user")
      }

      // ✅ Remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setMessage("✅ User deleted successfully")
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    }
  }

  if (loading) return <p>Loading users...</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Delete User</h2>
      {message && <p className="text-sm">{message}</p>}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul className="divide-y border rounded-md">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-gray-600">{user.role}</p>
              </div>
              <button
                onClick={() => handleDelete(user)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={user.id === currentUserId}
              >
                {user.id === currentUserId ? "Cannot delete self" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
