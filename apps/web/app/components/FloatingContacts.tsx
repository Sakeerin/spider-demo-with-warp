import Image from 'next/image';

export default function FloatingContacts() {
  return (
    <div
      className="pointer-events-none fixed right-0 bottom-0 z-[999] flex flex-col items-end gap-3"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        paddingRight: 'calc(max(env(safe-area-inset-right), 0px) + 10px)' // margin-right: 10px
      }}
    >
      <a
        href="tel:000"
        title="โทรหาเรา"
        className="pointer-events-auto inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl ring-2 ring-white/80 transition-transform duration-150 hover:scale-110 active:scale-95"
        aria-label="โทรหาเรา"
      >
        <Image src="/phone.svg" alt="โทร" width={24} height={24} className="h-6 w-6 invert-[1] brightness-0 opacity-95" />
      </a>
      <a
        href="#line"
        title="LINE Official"
        className="pointer-events-auto inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#06C755] to-[#05b54d] text-white shadow-xl ring-2 ring-white/80 transition-transform duration-150 hover:scale-110 active:scale-95"
        aria-label="LINE Official"
      >
        <Image src="/line.svg" alt="LINE" width={24} height={24} className="h-6 w-6" />
      </a>
    </div>
  );
}
