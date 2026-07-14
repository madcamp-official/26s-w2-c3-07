import Link from 'next/link';

export function AppHeader() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-bold text-parchment-100 transition-opacity hover:opacity-80">
      <span aria-hidden>🕵️</span>
      그 뜻이 아니예라
    </Link>
  );
}
