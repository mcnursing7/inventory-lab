'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BarcodeScanner from '@/components/BarcodeScanner';

type Item = { id: string; sku: string | null; name: string; barcode?: string | null };
type Location = { id: string; name: string };
type InventoryRow = {
  id: string;
  item_id: string;
  location_id: string;
  qty: number;
  updated_at: string;
  item: Item | null;
  location: Location | null;
};

export default function InventoryPage() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID!;
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scanActive, setScanActive] = useState(false);

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [{ data: invData }, { data: itemsData }, { data: locData }] = await Promise.all([
          supabase.from('inventory').select('*').eq('organization_id', orgId),
          supabase.from('items').select('id, sku, name, barcode').eq('organization_id', orgId),
          supabase.from('locations').select('*').eq('organization_id', orgId),
        ]);

        setItems(itemsData ?? []);
        setLocations(locData ?? []);

        const merged: InventoryRow[] = (invData ?? []).map(inv => ({
          ...inv,
          qty: Number(inv.qty ?? 0),
          item: (itemsData ?? []).find(i => i.id === inv.item_id) ?? null,
          location: (locData ?? []).find(l => l.id === inv.location_id) ?? null,
        }));

        setInventory(merged);
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('realtime-inventory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload: any) => {
          const invRow = payload.new || payload.old;
          if (!invRow) return;

          setInventory(prev => {
            const idx = prev.findIndex(
              r => r.item_id === invRow.item_id && r.location_id === invRow.location_id
            );

            const updatedRow: InventoryRow = {
              ...invRow,
              qty: Number(invRow.qty ?? 0),
              item: items.find(i => i.id === invRow.item_id) ?? null,
              location: locations.find(l => l.id === invRow.location_id) ?? null,
            };

            if (idx >= 0) {
              const newArr = [...prev];
              newArr[idx] = updatedRow;
              return newArr;
            } else {
              return [updatedRow, ...prev];
            }
          });
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, items, locations]);

  const filteredInventory = inventory.filter(row => {
    const q = search.toLowerCase();
    return (
      row.item?.name.toLowerCase().includes(q) ||
      row.item?.sku?.toLowerCase().includes(q) ||
      row.item?.barcode?.toLowerCase().includes(q) ||
      row.location?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Search by item, SKU, barcode, or location"
          className="border p-2 rounded w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setScanActive(s => !s)}
          className="px-3 py-2 rounded bg-blue-500 text-white"
        >
          {scanActive ? 'Stop Scan' : 'Scan'}
        </button>
      </div>

      {/* Scanner mounts only when active */}
      <BarcodeScanner
        active={scanActive}
        onScan={code => {
          setSearch(code);
          setScanActive(false);
        }}
      />

      {loading && <p className="text-gray-500 text-sm mt-2">Loading inventory…</p>}

      <div className="overflow-x-auto border rounded mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Item</th>
              <th className="p-2 border text-left">SKU</th>
              <th className="p-2 border text-left">Location</th>
              <th className="p-2 border text-right">Qty</th>
              <th className="p-2 border text-left">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No inventory found.
                </td>
              </tr>
            )}

            {filteredInventory.map(row => (
              <tr key={`${row.item_id}-${row.location_id}`}>
                <td className="p-2 border">{row.item?.name ?? 'Unknown'}</td>
                <td className="p-2 border">{row.item?.sku ?? '-'}</td>
                <td className="p-2 border">{row.location?.name ?? '-'}</td>
                <td className="p-2 border text-right">{row.qty}</td>
                <td className="p-2 border">{new Date(row.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
