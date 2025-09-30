export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <nav className="mt-4 flex gap-3 text-sm">
        <a href="/admin/contractors" className="underline">Approvals</a>
        <a href="/admin/leads" className="underline">Leads</a>
        <a href="/admin/content" className="underline">Content</a>
      </nav>
      <div className="mt-6">{children}</div>
    </main>
  );
}
