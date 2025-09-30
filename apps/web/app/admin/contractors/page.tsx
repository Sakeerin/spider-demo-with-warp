"use client";
import { useEffect, useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const token = localStorage.getItem("adminToken");
    if (!token) return (window.location.href = "/admin/login");
    const res = await fetch(`${base}/api/admin/contractors/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return (window.location.href = "/admin/login");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : data.value || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/contractors/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note: "ok" }),
    });
    load();
  }

  async function reject(id: string) {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/contractors/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "not fit" }),
    });
    load();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded border bg-white p-3">
          <div>
            <div className="font-medium">{c.businessName}</div>
            <div className="text-xs text-gray-500">exp {c.experience} yrs • success {Math.round((c.successRate || 0)*100)}%</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(c.id)} className="rounded bg-emerald-600 px-3 py-1 text-white">Approve</button>
            <button onClick={() => reject(c.id)} className="rounded bg-red-600 px-3 py-1 text-white">Reject</button>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-gray-500">No pending approvals.</div>}
    </div>
  );
}
