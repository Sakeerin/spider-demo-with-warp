import Link from 'next/link';

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export default function Pagination({ meta, basePath, searchParams = {} }: { meta: PaginationMeta; basePath: string; searchParams?: Record<string, string | number | undefined>; }) {
  const { page, pageSize, pageCount } = meta;
  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && k !== 'page') params.set(k, String(v));
    });
    params.set('page', String(p));
    params.set('pageSize', String(pageSize));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <Link
        href={makeHref(Math.max(1, page - 1))}
        className={`px-3 py-1 rounded border ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={page <= 1}
      >
        Previous
      </Link>
      <div className="flex items-center gap-2">
        {Array.from({ length: pageCount }).slice(0, 7).map((_, idx) => {
          const p = idx + 1;
          return (
            <Link key={p} href={makeHref(p)} className={`px-3 py-1 rounded border ${p === page ? 'bg-gray-200 font-semibold' : ''}`}>
              {p}
            </Link>
          );
        })}
        {pageCount > 7 ? <span className="px-2">…</span> : null}
      </div>
      <Link
        href={makeHref(Math.min(pageCount || 1, page + 1))}
        className={`px-3 py-1 rounded border ${page >= pageCount ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={page >= pageCount}
      >
        Next
      </Link>
    </div>
  );
}
