import type { Suspect } from "@/features/case/types";

export function SuspectProfileBar({ suspect }: { suspect: Suspect }) {
  return (
    <div className="flex flex-1 items-center gap-4 border border-brass-600/40 bg-noir-800/85 px-5 py-4">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-brass-600/40 bg-noir-900/70 text-lg"
      >
        👤
      </span>
      <p className="text-sm text-parchment-200 md:text-base">
        <span className="font-display font-bold text-parchment-100">{suspect.name}</span>
        <span className="mx-2 text-brass-500/60">|</span>
        {suspect.age}세<span className="mx-2 text-brass-500/60">|</span>
        {suspect.job}
        <span className="mx-2 text-brass-500/60">|</span>
        {suspect.relationship}
      </p>
    </div>
  );
}
