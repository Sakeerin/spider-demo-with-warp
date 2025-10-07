"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState<any>({ status: "First Contact", serviceType: "general" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token) return (window.location.href = "/admin/login");
    const res = await fetch(`${base}/api/admin/crm/leads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data?.lead?.id) router.push(`/admin/crm/leads/${data.lead.id}`);
  }

  function set(name: string, value: any) { setForm((f:any)=>({ ...f, [name]: value })); }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded border bg-white p-4 md:grid-cols-2">
      <div>
        <label className="block text-xs text-gray-600">Company</label>
        <input onChange={(e)=>set('companyName', e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Contact Name</label>
        <input onChange={(e)=>set('contactName', e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Mobile</label>
        <input onChange={(e)=>set('mobilePhone', e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Email</label>
        <input onChange={(e)=>set('email', e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Source</label>
        <select defaultValue="Chat" onChange={(e)=>set('source', e.target.value)} className="w-full rounded border px-3 py-2">
          <option>Chat</option>
          <option>Ads</option>
          <option>Phone</option>
          <option>Event</option>
          <option>Referral</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Status</label>
        <select defaultValue="First Contact" onChange={(e)=>set('status', e.target.value)} className="w-full rounded border px-3 py-2">
          <option>First Contact</option>
          <option>Qualified</option>
          <option>Closed</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-600">Detail / Note</label>
        <textarea onChange={(e)=>set('detail', e.target.value)} className="w-full rounded border px-3 py-2" rows={4} />
      </div>
      <button className="md:col-span-2 rounded bg-black px-4 py-2 text-white">Create Lead</button>
    </form>
  );
}
