"use client";
import { useEffect, useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page() {
  const [promos, setPromos] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    const token = localStorage.getItem("adminToken");
    if (!token) return (window.location.href = "/admin/login");
    const [p, n] = await Promise.all([
      fetch(`${base}/api/admin/promotions`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${base}/api/admin/news`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    setPromos(await p.json());
    setNews(await n.json());
  }

  useEffect(() => { load(); }, []);

  async function createPromo() {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/promotions`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: content, isActive: true })
    });
    setTitle(""); setContent("");
    load();
  }

  async function createNews() {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/news`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, isActive: true })
    });
    setTitle(""); setContent("");
    load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h3 className="font-semibold">Promotions</h3>
        <div className="mt-2 space-y-2">
          {promos.map((p: any) => (
            <div key={p.id} className="rounded border bg-white p-2 text-sm">
              <div className="font-medium">{p.title}</div>
              <div className="text-gray-500">{p.description}</div>
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
            </div>
          ))}
        </div>
      </section>

      <section className="md:col-span-2">
        <h3 className="font-semibold">Create Promotion/News</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded border px-3 py-2" />
          <input value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Content/Description" className="w-full rounded border px-3 py-2" />
          <button onClick={createPromo} className="rounded bg-blue-600 px-3 py-2 text-white">Create Promotion</button>
          <button onClick={createNews} className="rounded bg-gray-700 px-3 py-2 text-white">Create News</button>
        </div>
      </section>
    </div>
  );
}
