"use client";
import { useState } from "react";
const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function NewPromotionPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function submit() {
    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return (window.location.href = "/admin/login");
      const res = await fetch(`${base}/api/admin/promotions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, description, isActive, validFrom: validFrom || null, validTo: validTo || null })
      });
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : null;
      if (data?.id) window.location.href = `/admin/content/promotions/${data.id}`;
      else window.location.href = `/admin/content/promotions`;
    } catch (e) {
      console.error('Create promotion error', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-semibold">New Promotion</h2>
      <div className="grid gap-3">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded border px-3 py-2" />
        <input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Category" className="w-full rounded border px-3 py-2" />
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" className="min-h-[120px] w-full rounded border px-3 py-2" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Valid From</label>
            <input type="datetime-local" value={validFrom} onChange={(e)=>setValidFrom(e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Valid To</label>
            <input type="datetime-local" value={validTo} onChange={(e)=>setValidTo(e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e)=>setIsActive(e.target.checked)} /> Active
        </label>
        <div className="flex gap-2">
          <button disabled={saving} onClick={submit} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">Create</button>
          <a href="/admin/content/promotions" className="rounded border px-3 py-2">Cancel</a>
        </div>
    </div>
  );
}
