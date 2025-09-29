import Link from 'next/link';

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">SPIDER</h1>
      <p className="mt-2 text-gray-700">Contractor marketplace is up and running.</p>
      <div className="mt-4 rounded-md border bg-white p-4">
        <p>
          API URL: <code>{process.env.NEXT_PUBLIC_API_URL}</code>
        </p>
        <p className="mt-2">Try the API health check at /api/health</p>
      </div>
      <div className="mt-6 flex gap-3">
        <Link href="/leads" className="rounded bg-black px-4 py-2 text-white">View Leads</Link>
        <Link href="/contractors" className="rounded bg-gray-800 px-4 py-2 text-white">View Contractors</Link>
      </div>
    </main>
  );
}
