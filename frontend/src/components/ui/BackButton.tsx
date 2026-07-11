import Link from "next/link";

export function BackButton({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 border border-brass-600/50 bg-noir-800/80 px-4 py-2 text-sm text-parchment-100 transition-colors hover:border-brass-400"
    >
      <span aria-hidden>←</span>
      뒤로
    </Link>
  );
}
