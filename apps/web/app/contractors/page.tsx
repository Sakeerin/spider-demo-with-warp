import Pagination from '../components/Pagination';

async function fetchContractors(page: number, pageSize: number) {
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${base}/api/contractors?page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch contractors');
  return res.json();
}

export default async function ContractorsPage({ searchParams }: { searchParams?: { page?: string; pageSize?: string } }) {
  const page = Number(searchParams?.page ?? '1') || 1;
  const pageSize = Number(searchParams?.pageSize ?? '10') || 10;
  const data = await fetchContractors(page, pageSize);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Contractors</h1>
      <div className="mt-4 overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Experience (yrs)</th>
              <th className="px-4 py-2">Success Rate</th>
              <th className="px-4 py-2">Response (hrs)</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.businessName}</td>
                <td className="px-4 py-2">{c.experience}</td>
                <td className="px-4 py-2">{Math.round((c.successRate ?? 0) * 100)}%</td>
                <td className="px-4 py-2">{c.responseTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={data.meta} basePath="/contractors" />
    </main>
  );
}
