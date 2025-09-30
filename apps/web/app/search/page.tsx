import Link from 'next/link';

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q || '').trim();
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async function fetchJson(path: string) {
    const res = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  }

  const [leads, contractors] = await Promise.all([
    fetchJson(`/api/leads?page=1&pageSize=50`),
    fetchJson(`/api/contractors?page=1&pageSize=50`),
  ]);

  const qLower = q.toLowerCase();
  const leadResults = (leads?.data || []).filter((l: any) =>
    !q ||
    l.serviceType?.toLowerCase().includes(qLower) ||
    l.description?.toLowerCase().includes(qLower) ||
    l.location?.toLowerCase().includes(qLower)
  );
  const contractorResults = (contractors?.data || []).filter((c: any) =>
    !q || c.businessName?.toLowerCase().includes(qLower)
  );

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">ผลการค้นหา{q ? `: "${q}"` : ''}</h1>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Leads</h2>
        {leadResults.length === 0 ? (
          <p className="text-gray-500 mt-2">ไม่พบรายการ</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {leadResults.map((l: any) => (
              <li key={l.id} className="rounded border bg-white p-3">
                <div className="text-sm text-gray-500">{l.serviceType} • {l.location}</div>
                <div className="font-medium">{l.description}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Contractors</h2>
        {contractorResults.length === 0 ? (
          <p className="text-gray-500 mt-2">ไม่พบรายการ</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {contractorResults.map((c: any) => (
              <li key={c.id} className="rounded border bg-white p-3">
                <div className="font-medium">{c.businessName}</div>
                <div className="text-sm text-gray-500">ประสบการณ์ {c.experience} ปี • อัตราสำเร็จ {Math.round((c.successRate ?? 0)*100)}%</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 text-sm text-gray-500">หมายเหตุ: การค้นหานี้เป็นตัวอย่าง (filter ฝั่ง frontend)</div>
    </main>
  );
}
