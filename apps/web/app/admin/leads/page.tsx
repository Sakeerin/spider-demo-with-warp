"use client";
import { useEffect, useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page() {
  const [leads, setLeads] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, any[]>>({});

  async function loadQueue() {
    const token = localStorage.getItem("adminToken");
    if (!token) return (window.location.href = "/admin/login");
    const res = await fetch(`${base}/api/admin/leads/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : data.value || []);
  }

  useEffect(() => { loadQueue(); }, []);

  async function match(leadId: string) {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/leads/${leadId}/match`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    loadAssignments(leadId);
  }

  async function loadAssignments(leadId: string) {
    const token = localStorage.getItem("adminToken")!;
    const res = await fetch(`${base}/api/admin/leads/${leadId}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAssignments((prev) => ({ ...prev, [leadId]: Array.isArray(data) ? data : data.value || [] }));
  }

  async function assign(leadId: string, contractorId: string) {
    const token = localStorage.getItem("adminToken")!;
    await fetch(`${base}/api/admin/leads/${leadId}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractorId })
    });
    loadQueue();
  }

  return (
    <div className="space-y-4">
      {leads.map((l) => (
        <div key={l.id} className="rounded border bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{l.serviceType} • {l.location}</div>
              <div className="text-xs text-gray-500">budget {l.budgetMin}-{l.budgetMax} • urgency {l.urgency}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => match(l.id)} className="rounded bg-blue-600 px-3 py-1 text-white">Random Match</button>
              <button onClick={() => loadAssignments(l.id)} className="rounded bg-gray-700 px-3 py-1 text-white">View Assignments</button>
            </div>
          </div>

          {assignments[l.id] && (
            <div className="mt-3 text-sm">
              <div className="font-medium">Assignments</div>
              <ul className="mt-1 space-y-1">
                {assignments[l.id].map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div>{a.contractor?.businessName}</div>
                      <div className="text-xs text-gray-500">status: {a.status}</div>
                    </div>
                    <button onClick={() => assign(l.id, a.contractorId)} className="rounded bg-emerald-600 px-3 py-1 text-white">Assign</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      {leads.length === 0 && <div className="text-sm text-gray-500">No leads in queue.</div>}
    </div>
  );
}
