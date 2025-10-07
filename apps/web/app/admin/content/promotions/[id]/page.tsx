"use client";
import { useEffect, useState } from "react";
const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function EditPromotionPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return (window.location.href = "/admin/login");
      const res = await fetch(`${base}/api/admin/promotions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return (window.location.href = "/admin/login");
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      setItem(data);
    } catch (e) {
      console.error('Load promotion error', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  function update(field: string, value: any) {
    setItem((prev:any)=> ({ ...prev, [field]: value }));
  }

  async function save() {
    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken")!;
      await fetch(`${base}/api/admin/promotions/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, category: item.category, description: item.description, validFrom: item.validFrom, validTo: item.validTo, isActive: item.isActive }) });
      await load();
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File) {
    const token = localStorage.getItem("adminToken")!;
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${base}/api/admin/promotions/${id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    load();
  }

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Not found</div>;

  return (
    <div className="max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Promotion</h2>
        <a className="text-sm underline" href="/admin/content/promotions">Back</a>
      </div>
      <div className="grid gap-3">
        <input value={item.title||""} onChange={(e)=>update('title', e.target.value)} placeholder="Title" className="w-full rounded border px-3 py-2" />
        <input value={item.category||""} onChange={(e)=>update('category', e.target.value)} placeholder="Category" className="w-full rounded border px-3 py-2" />
        <textarea value={item.description||""} onChange={(e)=>update('description', e.target.value)} placeholder="Description" className="min-h-[120px] w-full rounded border px-3 py-2" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Valid From</label>
            <input type="datetime-local" value={item.validFrom ? new Date(item.validFrom).toISOString().slice(0,16) : ''} onChange={(e)=>update('validFrom', e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Valid To</label>
            <input type="datetime-local" value={item.validTo ? new Date(item.validTo).toISOString().slice(0,16) : ''} onChange={(e)=>update('validTo', e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!item.isActive} onChange={(e)=>update('isActive', e.target.checked)} /> Active
        </label>
        <div className="flex gap-2">
          <button disabled={saving} onClick={save} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">Save</button>
          <a href="/admin/content/promotions" className="rounded border px-3 py-2">Cancel</a>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold">Images</h3>
        {Array.isArray(item.images) && item.images.length>0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.images.map((img:string, idx:number)=> (
              <div key={idx} className="relative">
                <img src={img} alt={item.title} className="h-16 w-16 rounded object-cover" />
                <button title="Remove" onClick={async()=>{ const token=localStorage.getItem('adminToken')!; await fetch(`${base}/api/admin/promotions/${id}/images?url=${encodeURIComponent(img)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load(); }} className="absolute -right-2 -top-2 rounded-full bg-white/80 px-1 text-xs">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 text-sm">
          <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadImage(f); }} />
        </div>
    </div>
  );
}
