"use client";
import { useEffect, useMemo, useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page({ searchParams }: { searchParams?: { q?: string; status?: string; page?: string } }) {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pageSize: 20, pageCount: 1 });
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(()=> Object.keys(selected).filter(k=>selected[k]), [selected]);

  const q = searchParams?.q || "";
  const status = searchParams?.status || "";
  const page = Number(searchParams?.page || "1");

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return (window.location.href = "/admin/login");
      const url = new URL(`${base}/api/admin/crm/leads`);
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      url.searchParams.set("page", String(page));
      const [res, resSales] = await Promise.all([
        fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/admin/crm/leads/sales-users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (res.status === 401 || resSales.status === 401) return (window.location.href = "/admin/login");
      const text1 = await res.text();
      const text2 = await resSales.text();
      const data = text1 ? JSON.parse(text1) : { data: [], meta: {} };
      const sdata = text2 ? JSON.parse(text2) : { data: [] };
      setItems(data.data || []);
      setMeta(data.meta || {});
      setSales(sdata.data || []);
    } catch (e) {
      console.error('Load error', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q, status, page]);

  function goto(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    window.location.search = params.toString();
  }

  async function bulkAssign(salesId: string) {
    const token = localStorage.getItem("adminToken")!;
    if (selectedIds.length === 0) return;
    await fetch(`${base}/api/admin/crm/leads/bulk`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, action: 'assignSales', value: { salesId } }) });
    // optimistic UI: clear selection and reload
    setSelected({});
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-gray-600">Query</label>
          <input defaultValue={q} onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; const params=new URLSearchParams(window.location.search); if(v) params.set('q',v); else params.delete('q'); params.delete('page'); window.location.search=params.toString(); } }} className="rounded border px-3 py-2" placeholder="name/email/mobile/company" />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Status</label>
          <select defaultValue={status} onChange={(e)=>{ const params=new URLSearchParams(window.location.search); const v=e.target.value; if(v) params.set('status',v); else params.delete('status'); params.delete('page'); window.location.search=params.toString(); }} className="rounded border px-3 py-2">
            <option value="">All</option>
            <option>First Contact</option>
            <option>Qualified</option>
            <option>Closed</option>
          </select>
        </div>
        <a href="/admin/crm/leads/new" className="ml-auto rounded bg-black px-3 py-2 text-white">New Lead</a>
        <a href="/admin/crm/leads/import" className="rounded border px-3 py-2">Import</a>
      </div>

      {loading ? (
        <div className="mt-4">Loading...</div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="text-sm text-gray-600">Selected: {selectedIds.length}</div>
            <select defaultValue="" onChange={(e)=>{ const v=e.target.value; if(v) { bulkAssign(v); e.currentTarget.value=''; } }} className="rounded border px-2 py-1 text-sm">
              <option value="">Bulk assign...</option>
              {sales.map((s:any)=> (
                <option key={s.id} value={s.id}>{s.name || s.email}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 space-y-2">
            {items.map((l)=> (
              <div key={l.id} className="flex items-stretch gap-2">
                <input type="checkbox" checked={!!selected[l.id]} onChange={(e)=> setSelected(prev=> ({ ...prev, [l.id]: e.target.checked }))} className="mt-3 h-4 w-4" />
                <a href={`/admin/crm/leads/${l.id}`} className="block w-full rounded border bg-white p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{l.contactName || l.company?.name || 'No name'}</div>
                      <div className="text-xs text-gray-500">{l.email || l.mobilePhone || '-'} • status {l.status} • created {new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>#{l.accountNumber}</div>
                      <div>{l.sales?.name || l.sales?.email || 'Unassigned'}</div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-gray-500">No results.</div>}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm">
        <button disabled={meta.page<=1} onClick={()=>goto(meta.page-1)} className="rounded border px-2 py-1 disabled:opacity-50">Prev</button>
        <div>Page {meta.page} / {meta.pageCount}</div>
        <button disabled={meta.page>=meta.pageCount} onClick={()=>goto(meta.page+1)} className="rounded border px-2 py-1 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
