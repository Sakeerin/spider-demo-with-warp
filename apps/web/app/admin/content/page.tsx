"use client";
import { useEffect, useState } from "react";
import { useAuthRole } from "../../components/useAuthRole";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page() {
  const [promos, setPromos] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  async function load() {
    const token = localStorage.getItem("adminToken");
    if (!token) return (window.location.href = "/admin/login");
    const [p, n] = await Promise.all([
      fetch(`${base}/api/admin/promotions`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${base}/api/admin/news`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const pr = await p.json();
    const ne = await n.json();
    setPromos(pr);
    setNews(ne);
  }

  useEffect(() => { load(); }, []);

  async function createPromo() {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/promotions`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: content, category, isActive: true })
    });
    setTitle(""); setContent(""); setCategory("");
    load();
  }

  async function createNews() {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/news`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category, isActive: true })
    });
    setTitle(""); setContent(""); setCategory("");
    load();
  }

  async function uploadPromoImage(id: string, file: File) {
    const token = localStorage.getItem("adminToken")!;
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${base}/api/admin/promotions/${id}/images`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    load();
  }

  async function uploadNewsImage(id: string, file: File) {
    const token = localStorage.getItem("adminToken")!;
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${base}/api/admin/news/${id}/images`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    load();
  }

  const role = useAuthRole();
  if (role !== 'admin') return <div className="rounded border bg-white p-4 text-sm">You are not authorized to view this page. Please <a className="underline" href="/admin/login">login</a> with sufficient permissions.</div>;
  return (
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="font-semibold">Promotions</h3>
        <div className="mt-2 space-y-2">
          {promos.map((p: any) => (
            <div key={p.id} className="rounded border bg-white p-2 text-sm">
              <div className="font-medium">{p.title}</div>
              <div className="text-gray-500">{p.description}</div>
              {p.category && <div className="text-xs text-gray-400">Category: {p.category}</div>}
              {Array.isArray(p.images) && p.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.images.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt={p.title} className="h-16 w-16 rounded object-cover" />
                  ))}
                </div>
              )}
              <div className="mt-2">
                <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadPromoImage(p.id, f); }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold">News</h3>
        <div className="mt-2 space-y-2">
          {news.map((n: any) => (
            <div key={n.id} className="rounded border bg-white p-2 text-sm">
              <div className="font-medium">{n.title}</div>
              <div className="text-gray-500">{n.content}</div>
              {n.category && <div className="text-xs text-gray-400">Category: {n.category}</div>}
              {Array.isArray(n.images) && n.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.images.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt={n.title} className="h-16 w-16 rounded object-cover" />
                  ))}
                </div>
              )}
              <div className="mt-2">
                <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadNewsImage(n.id, f); }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="md:col-span-2">
        <h3 className="font-semibold">Create Promotion/News</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded border px-3 py-2" />
          <input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Category" className="w-full rounded border px-3 py-2" />
          <input value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Content/Description" className="w-full rounded border px-3 py-2" />
          <button onClick={createPromo} className="rounded bg-blue-600 px-3 py-2 text-white">Create Promotion</button>
          <button onClick={createNews} className="rounded bg-gray-700 px-3 py-2 text-white">Create News</button>
        </div>
      </section>
      </div>
  );
}
