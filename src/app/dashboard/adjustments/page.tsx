'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BarcodeScanner from '@/components/BarcodeScanner';

type Item = { id: string; sku: string | null; name: string; barcode?: string | null };
type Location = { id: string; name: string };

// include 'receive' since your DB check allows it
type AdjustReason = 'usage' | 'wastage' | 'correction' | 'receive';

type AdjustmentRow = {
  id: string;
  change: number;
  reason: AdjustReason;
  user_id: string | null;
  created_at: string;
  item: Item | null;
  location: Location | null;
};

type InventoryMap = Record<string /*locationId*/, Record<string /*itemId*/, number>>;

type InventoryRowBackend = {
  id: string;
  organization_id: string;
  item_id: string;
  location_id: string;
  qty: number;
  updated_at: string;
};

export default function AdjustmentsPage() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID!;
  const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID ?? null;

  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [inventoryMap, setInventoryMap] = useState<InventoryMap>({});

  // Form state
  const [locationId, setLocationId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qtyChange, setQtyChange] = useState(0);
  const [reason, setReason] = useState<AdjustReason>('usage');
  const [submitting, setSubmitting] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Load base data
  useEffect(() => {
    // fire in parallel
    fetchItems();
    fetchLocations();
    fetchInventoryMap();
    fetchAdjustments();

    // Realtime inventory updates
    const invChannel = supabase
      .channel('rt-inventory-for-org')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${orgId}` },
        () => fetchInventoryMap()
      )
      .subscribe();

    // Realtime adjustments updates
    const adjChannel = supabase
      .channel('rt-adjustments-for-org')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'adjustments', filter: `organization_id=eq.${orgId}` },
        () => fetchAdjustments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invChannel);
      supabase.removeChannel(adjChannel);
    };
  }, [orgId]);

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('id, sku, name, barcode')
      .eq('organization_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }
    setItems((data ?? []) as Item[]);
  }

  async function fetchLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .eq('organization_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }
    setLocations((data ?? []) as Location[]);
  }

  async function fetchInventoryMap() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('organization_id', orgId);

    if (error) {
      console.error(error);
      return;
    }

    const rows = (data ?? []) as InventoryRowBackend[];
    const map: InventoryMap = {};
    for (const r of rows) {
      if (!map[r.location_id]) map[r.location_id] = {};
      map[r.location_id][r.item_id] = r.qty;
    }
    setInventoryMap(map);
  }

  // 🎯 KEY FIX: join items + locations so names are available (no "Unknown")
  async function fetchAdjustments() {
    const { data, error } = await supabase
      .from('adjustments')
      .select(`
        id,
        change,
        reason,
        user_id,
        created_at,
        item:items ( id, name, sku, barcode ),
        location:locations ( id, name )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      return;
    }

    // PostgREST returns single objects for these FK joins (or null)
    setAdjustments((data ?? []) as unknown as AdjustmentRow[]);
  }

  const filteredItems = useMemo(() => {
    const txt = itemSearch.trim().toLowerCase();
    if (!txt) return items;
    return items.filter(
      it =>
        it.name.toLowerCase().includes(txt) ||
        it.sku?.toLowerCase().includes(txt) ||
        it.barcode?.toLowerCase().includes(txt)
    );
  }, [items, itemSearch]);

  const currentQty = useMemo(() => {
    if (!locationId || !selectedItemId) return 0;
    return inventoryMap[locationId]?.[selectedItemId] ?? 0;
  }, [inventoryMap, locationId, selectedItemId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setOkMsg(null);

    if (!locationId) return setErrorMsg('Please choose a location.');
    if (!selectedItemId) return setErrorMsg('Please choose an item.');
    if (!qtyChange || isNaN(qtyChange)) return setErrorMsg('Enter a valid quantity.');

    let change = qtyChange;
    if ((reason === 'usage' || reason === 'wastage') && qtyChange > 0) {
      change = -Math.abs(qtyChange);
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('adjustments').insert([
        {
          organization_id: orgId,
          item_id: selectedItemId,
          location_id: locationId,
          user_id: testUserId,
          change,
          reason,
        },
      ]);

      if (error) setErrorMsg(error.message);
      else {
        setOkMsg('Adjustment saved.');
        setQtyChange(0);

        // optimistic refresh (inventory & adjustments)
        await Promise.all([fetchInventoryMap(), fetchAdjustments()]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Adjustments</h1>

      {errorMsg && <div className="p-3 rounded bg-red-100 text-red-800">{errorMsg}</div>}
      {okMsg && <div className="p-3 rounded bg-green-100 text-green-800">{okMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-3 border rounded p-4">
        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)} className="border p-2 rounded w-full" required>
              <option value="">Select location</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Find item</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name, SKU, barcode"
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <button type="button" onClick={() => setScanActive(s => !s)} className="px-3 py-2 rounded bg-blue-500 text-white">
                {scanActive ? 'Stop Scan' : 'Scan'}
              </button>
            </div>
            <BarcodeScanner active={scanActive} onScan={text => { setItemSearch(text); setScanActive(false); }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Item</label>
          <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="border p-2 rounded w-full" required>
            <option value="">Select item</option>
            {filteredItems.map(it => (
              <option key={it.id} value={it.id}>
                {it.name} ({it.sku ?? 'no-sku'}) {locationId ? `— Qty: ${inventoryMap[locationId]?.[it.id] ?? 0}` : ''}
              </option>
            ))}
          </select>
          {locationId && selectedItemId && <p className="text-xs text-gray-600 mt-1">Current qty: <span className="font-semibold">{currentQty}</span></p>}
        </div>

        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity change</label>
            <input type="number" step="1" className="border p-2 rounded w-full" value={qtyChange} onChange={e => setQtyChange(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value as AdjustReason)} className="border p-2 rounded w-full" required>
              <option value="usage">Usage (–)</option>
              <option value="wastage">Wastage (–)</option>
              <option value="correction">Correction (±)</option>
              <option value="receive">Receive (+)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-blue-500 text-white w-full">
              {submitting ? 'Saving…' : 'Save Adjustment'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 border rounded overflow-x-auto">
        <div className="px-3 py-2 bg-gray-50 border-b font-medium">Recent Adjustments</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Date</th>
              <th className="p-2 border text-left">Location</th>
              <th className="p-2 border text-left">Item</th>
              <th className="p-2 border text-right">Qty change</th>
              <th className="p-2 border text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map(a => (
              <tr key={a.id}>
                <td className="p-2 border">{new Date(a.created_at).toLocaleString()}</td>
                <td className="p-2 border">{a.location?.name ?? 'Unknown'}</td>
                <td className="p-2 border">{a.item ? `${a.item.name} (${a.item.sku ?? '-'})` : 'Unknown'}</td>
                <td className="p-2 border text-right">{a.change}</td>
                <td className="p-2 border capitalize">{a.reason}</td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No adjustments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
