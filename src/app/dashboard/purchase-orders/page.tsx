"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type PurchaseOrder = {
  id: string;
  po_number: number;
  vendor_id: string;
  vendor_name: string;
  status: string;
  total_price: number | null;
  created_at: string;
};

export default function PurchaseOrdersPage() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID!;
  const router = useRouter();

  const [poList, setPoList] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPOs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("purchase_orders")
          .select(`
            id,
            po_number,
            status,
            total_price,
            created_at,
            vendor_id,
            vendors!inner(name)
          `)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Map Supabase data to TS type, safely extracting vendor name
        const formattedPOs: PurchaseOrder[] = (data ?? []).map((po: any) => ({
          id: po.id,
          po_number: po.po_number,
          status: po.status,
          total_price: po.total_price,
          created_at: po.created_at,
          vendor_id: po.vendor_id,
          vendor_name: po.vendors?.name ?? "-",
        }));

        setPoList(formattedPOs);
      } catch (err) {
        console.error("Error loading POs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPOs();
  }, [orgId]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        {/* NEW PO BUTTON */}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => router.push("/dashboard/purchase-orders/new")}
        >
          New PO
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading POs…</p>}

      <div className="overflow-x-auto border rounded mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">PO Number</th>
              <th className="p-2 border text-left">Vendor</th>
              <th className="p-2 border text-left">Status</th>
              <th className="p-2 border text-right">Total Price</th>
              <th className="p-2 border text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {poList.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No purchase orders found.
                </td>
              </tr>
            )}

            {poList.map((po) => (
              <tr
                key={po.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/dashboard/purchase-orders/${po.id}/details`)}
              >
                <td className="p-2 border text-indigo-600 font-medium">
                  PO-{po.po_number}
                </td>
                <td className="p-2 border">{po.vendor_name}</td>
                <td className="p-2 border">{po.status}</td>
                <td className="p-2 border text-right">
                  {po.total_price?.toFixed(2) ?? "-"}
                </td>
                <td className="p-2 border">
                  {new Date(po.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
