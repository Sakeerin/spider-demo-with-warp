"use client";
import { useEffect, useState } from "react";
import { useAuthRole } from "../../../components/useAuthRole";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function NewsListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return (window.location.href = "/admin/login");
      const url = new URL(`${base}/api/admin/news`);
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') || '';
      const category = sp.get('category') || '';
      if (q) url.searchParams.set('q', q);
      if (category) url.searchParams.set('category', category);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return (window.location.href = "/admin/login");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setItems(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      console.error("Load news error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(id: string, isActive: boolean) {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/news/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this news item?")) return;
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/news/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function uploadImage(id: string, file: File) {
    const token = localStorage.getItem("adminToken")!;
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${base}/api/admin/news/${id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    load();
  }

  const role = useAuthRole();
  if (role !== 'admin') return <div className="rounded border bg-white p-4 text-sm">You are not authorized to view this page. Please <a className="underline" href="/admin/login">login</a> with sufficient permissions.</div>;
  return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">News</h2>
        <a href="/admin/content/news/new" className="rounded bg-black px-3 py-2 text-white">New News</a>
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-2 text-sm">
        <div>
          <label className="block text-xs text-gray-600">Query</label>
          <input defaultValue={new URLSearchParams(window.location.search).get('q')||''} onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; const params=new URLSearchParams(window.location.search); if(v) params.set('q', v); else params.delete('q'); window.location.search=params.toString(); } }} className="rounded border px-2 py-1" placeholder="title/content" />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Category</label>
          <input defaultValue={new URLSearchParams(window.location.search).get('category')||''} onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; const params=new URLSearchParams(window.location.search); if(v) params.set('category', v); else params.delete('category'); window.location.search=params.toString(); } }} className="rounded border px-2 py-1" placeholder="category" />
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {items.map((n:any) => (
            <div key={n.id} className="rounded border bg-white p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a href={`/admin/content/news/${n.id}`} className="font-medium hover:underline">{n.title}</a>
                  {n.category && <div className="text-xs text-gray-500">Category: {n.category}</div>}
                  <div className="text-xs text-gray-500">{n.content}</div>
                  {Array.isArray(n.images) && n.images.length>0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {n.images.map((img:string, idx:number)=> (
                        <div key={idx} className="relative">
                          <img src={img} alt={n.title} className="h-16 w-16 rounded object-cover" />
                          <button title="Remove" onClick={async()=>{ const token=localStorage.getItem('adminToken')!; await fetch(`${base}/api/admin/news/${n.id}/images?url=${encodeURIComponent(img)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load(); }} className="absolute -right-2 -top-2 rounded-full bg-white/80 px-1 text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                  <button onClick={()=>toggleActive(n.id, n.isActive)} className="rounded border px-2 py-1">{n.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={()=>remove(n.id)} className="rounded border px-2 py-1 text-red-600">Delete</button>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadImage(n.id, f); }} />
              </div>
            </div>
          ))}
          {items.length===0 && <div className="text-sm text-gray-500">No news yet.</div>}
        </div>
      )}
      </div>
  );
}
