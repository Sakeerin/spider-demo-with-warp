"use client";
import { useEffect, useRef, useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const [lead, setLead] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return (window.location.href = "/admin/login");
      const [a, b, c] = await Promise.all([
        fetch(`${base}/api/admin/crm/leads/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/admin/crm/leads/${id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/admin/crm/leads/sales-users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (a.status === 401 || b.status === 401 || c.status === 401) return (window.location.href = "/admin/login");
      const [t1, t2, t3] = await Promise.all([a.text(), b.text(), c.text()]);
      setLead(t1 ? JSON.parse(t1) : null);
      setTasks(t2 ? JSON.parse(t2) : []);
      const salesData = t3 ? JSON.parse(t3) : { data: [] };
      setSales(salesData.data || []);
    } catch (e) {
      console.error('Load lead error', e);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function createTask() {
    if (!newTask.trim()) return;
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/crm/leads/${id}/tasks`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTask }) });
    setNewTask("");
    load();
  }

  async function score() {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/crm/leads/${id}/score`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  async function uploadAttachment(file: File) {
    const token = localStorage.getItem("adminToken")!;
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${base}/api/admin/crm/leads/${id}/attachments`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    load();
  }

  async function assignSales(salesId: string) {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/crm/leads/${id}/assign-sales`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ salesId }) });
    load();
  }

  if (!lead) return <div>Loading...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="rounded border bg-white p-3 md:col-span-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold">{lead.contactName || lead.company?.name || 'No name'} <span className="text-xs text-gray-500">#{lead.accountNumber}</span></div>
            <div className="text-xs text-gray-500">{lead.email || lead.mobilePhone || '-'} • status {lead.status} • score {lead.score || 0} ({lead.scoreBand || '-'})</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Assigned to</div>
            <select value={lead.sales?.id || ''} onChange={(e)=>assignSales(e.target.value)} className="rounded border px-2 py-1 text-sm">
              <option value="">Select sales...</option>
              {sales.map((s:any)=> (
                <option key={s.id} value={s.id}>{s.name || s.email}</option>
              ))}
            </select>
            <button onClick={score} className="rounded bg-blue-600 px-3 py-1 text-white">Score</button>
          </div>
        </div>

        <div className="mt-3 text-sm">
          <div className="font-medium">Detail</div>
          <div className="whitespace-pre-wrap text-gray-700">{lead.detail || '-'}</div>
        </div>

        <div className="mt-3 text-sm">
          <div className="font-medium">Attachments</div>
          <div className="mt-2 flex items-center gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e)=>{ if(e.target.files && e.target.files[0]) uploadAttachment(e.target.files[0]); }} />
            <button onClick={()=>fileRef.current?.click()} className="rounded border px-3 py-1">Upload</button>
          </div>
          <ul className="mt-2 space-y-1">
            {(lead.attachments || []).map((a:any)=> {
              const href = a.url?.startsWith('http') ? a.url : `${base}${a.url}`;
              return <li key={a.id} className="text-xs"><a className="text-blue-700 underline" href={href} target="_blank" rel="noreferrer">{a.fileName}</a></li>
            })}
          </ul>
        </div>

        <div className="mt-3 text-sm">
          <div className="font-medium">Activity Timeline</div>
          <ul className="mt-2 space-y-1">
            {(lead.activities || []).slice().reverse().map((ac:any)=> (
              <li key={ac.id} className="text-xs text-gray-700">[{new Date(ac.createdAt).toLocaleString()}] {ac.type} - {ac.message}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded border bg-white p-3">
        <div className="font-medium">Tasks</div>
        <div className="mt-2 flex gap-2">
          <input value={newTask} onChange={(e)=>setNewTask(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="Task title" />
          <button onClick={createTask} className="rounded bg-black px-3 py-2 text-white">Add</button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {tasks.map((t)=> (
            <li key={t.id} className="rounded border p-2">{t.title} {t.dueAt && <span className="text-xs text-gray-500">(due {new Date(t.dueAt).toLocaleString()})</span>}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
