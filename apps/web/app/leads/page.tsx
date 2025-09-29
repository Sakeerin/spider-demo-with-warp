import Pagination from '../components/Pagination';

async function fetchLeads(page: number, pageSize: number) {
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${base}/api/leads?page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export default async function LeadsPage({ searchParams }: { searchParams?: { page?: string; pageSize?: string } }) {
  const page = Number(searchParams?.page ?? '1') || 1;
  const pageSize = Number(searchParams?.pageSize ?? '10') || 10;
  const data = await fetchLeads(page, pageSize);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Leads</h1>
      <div className="mt-4 overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Budget</th>
              <th className="px-4 py-2">Urgency</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((lead: any) => (
              <tr key={lead.id} className="border-t">
                <td className="px-4 py-2">{lead.serviceType}</td>
                <td className="px-4 py-2">{lead.description}</td>
                <td className="px-4 py-2">{lead.location}</td>
                <td className="px-4 py-2">{lead.budgetMin?.toLocaleString()} - {lead.budgetMax?.toLocaleString()}</td>
                <td className="px-4 py-2">{lead.urgency}</td>
                <td className="px-4 py-2">{lead.status}</td>
                <td className="px-4 py-2">{new Date(lead.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={data.meta} basePath="/leads" />
    </main>
  );
}
