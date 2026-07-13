import Link from "next/link";

export function SelectSuspectButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center justify-center border border-evidence-red bg-evidence-red/20 px-10 py-4 font-display text-lg font-bold text-parchment-100 transition-colors hover:bg-evidence-red/40"
    >
      선택
    </Link>
  );
}
