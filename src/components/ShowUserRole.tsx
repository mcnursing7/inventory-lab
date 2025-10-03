"use client";

import { useEffect, useState } from "react";

export default function ShowUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/test-jwt", { credentials: "include" });
        const data = await res.json();

        if (res.ok) {
          setRole(data.user_role);
        } else {
          setError(data.error || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) return <p>Loading user role...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return <p>User role: <strong>{role}</strong></p>;
}
