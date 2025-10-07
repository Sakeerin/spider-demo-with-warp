"use client";
import { useEffect, useState } from 'react';
import { useAuthRole } from "../components/useAuthRole";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = useAuthRole();
  const [ready, setReady] = useState(false);
  useEffect(()=>{ setReady(true); },[]);
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <nav className="mt-4 flex flex-wrap gap-3 text-sm">
        <a href="/admin/contractors" className="underline">Approvals</a>
        <a href="/admin/leads" className="underline">Legacy Leads</a>
        {role === 'admin' && <a href="/admin/content" className="underline">Content</a>}
        {role === 'admin' && <a href="/admin/content/promotions" className="underline">Promotions</a>}
        {role === 'admin' && <a href="/admin/content/news" className="underline">News</a>}
        <a href="/admin/crm/leads" className="underline">CRM Leads</a>
        {role !== null && <a href="/admin/crm/leads/new" className="underline">New Lead</a>}
        {role !== null && <a href="/admin/crm/leads/import" className="underline">Import</a>}
      </nav>
      <div className="mt-6">{ready ? children : null}</div>
    </main>
  );
}
