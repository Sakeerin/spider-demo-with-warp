"use client";
import { useState } from "react";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [step, setStep] = useState<'upload'|'preview'|'done'>('upload');

  async function doPreview() {
    if (!file) return;
    const token = localStorage.getItem("adminToken");
    if (!token) return (window.location.href = "/admin/login");
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${base}/api/admin/crm/leads/import/preview`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json();
    setPreview(data.preview || []);
    setStep('preview');
  }

  async function commit() {
    const token = localStorage.getItem("adminToken")!;
    const res = await fetch(`${base}/api/admin/crm/leads/import/commit`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: preview }) });
    const data = await res.json();
    setStep('done');
  }

  return (
    <div className="space-y-4">
      {step==='upload' && (
        <div className="rounded border bg-white p-4">
          <h3 className="font-semibold">Upload CSV/XLSX</h3>
          <input type="file" onChange={(e)=> setFile(e.target.files?.[0] || null)} className="mt-2" />
          <div className="mt-3">
            <button disabled={!file} onClick={doPreview} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">Preview</button>
          </div>
        </div>
      )}

      {step==='preview' && (
        <div className="rounded border bg-white p-4">
          <h3 className="font-semibold">Preview ({preview.length})</h3>
          <div className="mt-2 max-h-96 overflow-auto text-sm">
            <table className="min-w-full">
              <thead><tr><th className="px-2 py-1 text-left">Contact</th><th className="px-2 py-1 text-left">Email</th><th className="px-2 py-1 text-left">Mobile</th><th className="px-2 py-1 text-left">Duplicate</th></tr></thead>
              <tbody>
                {preview.map((r:any, i:number)=> (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{r.contactName || r.companyName || '-'}</td>
                    <td className="px-2 py-1">{r.email || '-'}</td>
                    <td className="px-2 py-1">{r.mobilePhone || '-'}</td>
                    <td className="px-2 py-1">{r._duplicate ? `#${r._duplicate.accountNumber}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={()=>setStep('upload')} className="rounded border px-3 py-2">Back</button>
            <button onClick={commit} className="rounded bg-emerald-600 px-4 py-2 text-white">Commit</button>
          </div>
        </div>
      )}

      {step==='done' && (
        <div className="rounded border bg-white p-4">
          <div>Import completed.</div>
          <a href="/admin/crm/leads" className="mt-2 inline-block underline">Go to Leads</a>
        </div>
      )}
    </div>
  );
}
