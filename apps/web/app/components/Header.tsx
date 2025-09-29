"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M2.01 6.003c0 8.284 6.715 14.999 14.999 14.999.98 0 1.94-.098 2.868-.284a1.5 1.5 0 0 0 1.152-1.74l-.427-2.137a1.5 1.5 0 0 0-1.474-1.205h-3.13a1.5 1.5 0 0 0-1.204.58l-.86 1.096a.75.75 0 0 1-.87.242 12.706 12.706 0 0 1-5.11-3.34 12.714 12.714 0 0 1-3.34-5.111.75.75 0 0 1 .243-.87l1.095-.86a1.5 1.5 0 0 0 .58-1.205V3.43a1.5 1.5 0 0 0-1.206-1.474L3.267 1.529a1.5 1.5 0 0 0-1.74 1.151c-.175.899-.257 1.83-.257 2.823z"/>
    </svg>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.24 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" clipRule="evenodd"/>
    </svg>
  );
}

const nav = [
  { label: 'บริการทั้งหมด', href: '#services' },
  { label: 'ลูกค้าภาคธุรกิจ', href: '#b2b' },
  { label: 'โปรโมชั่น', href: '#promo' },
  { label: 'Catalog ผู้รับเหมา', href: '#catalog' },
  {
    label: 'Smart Home',
    items: [
      { label: 'โซล่าเซลล์', href: '#solar' },
      { label: 'EV - Charger', href: '#ev' },
      { label: 'Smart Devices', href: '#smart' },
    ],
  },
  {
    label: 'เกี่ยวกับ Spider',
    items: [
      { label: 'ความเป็นมา', href: '#about' },
      { label: 'แนวคิดการดำเนินธุรกิจ', href: '#vision' },
      { label: 'คำถามที่พบบ่อย', href: '#faq' },
    ],
  },
  { label: 'สมัครผู้รับเหมา', href: '#apply' },
  { label: 'ผลงานข่าวสาร', href: '#news' },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-orange-500 text-white font-bold">S</span>
            <div className="leading-tight">
              <div className="font-bold text-gray-900">SPIDER</div>
              <div className="text-xs text-gray-500">โบร๊กเกอร์จัดหาผู้รับเหมา</div>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="search"
              placeholder="ค้นหาบริการ และสินค้า"
              className="w-full rounded-full border px-5 py-2 pl-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="#survey" className="hidden sm:flex items-center gap-2 rounded-full border-2 border-red-500 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100">
            <PhoneIcon className="h-5 w-5" />
            <span className="whitespace-nowrap">เมนูนัด นัดสำรวจหน้างาน</span>
          </Link>
          <button className="rounded-full border px-3 py-2 text-sm">🇹🇭</button>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link href="#login" className="hover:underline">เข้าสู่ระบบ</Link>
            <span>•</span>
            <Link href="#signup" className="hover:underline">ลงทะเบียน</Link>
          </div>
        </div>
      </div>

      <nav className="mx-auto hidden max-w-7xl items-stretch gap-2 px-4 pb-3 md:flex">
        {nav.map((item) => (
          <div key={item.label} className="group relative">
            {'items' in item ? (
              <>
                <button className="flex items-center gap-1 rounded-lg bg-blue-900 px-4 py-2 text-white hover:bg-blue-800">
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </button>
                <div className="invisible absolute left-0 mt-2 min-w-[220px] rounded-lg border bg-white p-2 shadow-lg group-hover:visible">
                  {(item as any).items.map((sub: any) => (
                    <Link key={sub.label} href={sub.href} className="block rounded px-3 py-2 text-sm hover:bg-gray-100">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href={(item as any).href} className="rounded-lg bg-blue-900 px-4 py-2 text-white hover:bg-blue-800">
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Floating contact buttons */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        <a href="tel:000" className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600" aria-label="Call">
          <PhoneIcon className="h-6 w-6" />
        </a>
        <a href="#line" className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg hover:opacity-90" aria-label="LINE">
          LINE
        </a>
      </div>
    </header>
  );
}