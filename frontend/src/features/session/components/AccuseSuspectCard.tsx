import type { Suspect } from "@/features/case/types";

type AccuseSuspectCardProps = {
  suspect: Suspect;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function AccuseSuspectCard({ suspect, isSelected, onSelect }: AccuseSuspectCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(suspect.id)}
      className={`relative overflow-hidden border bg-noir-900/60 text-left transition-colors ${
        isSelected
          ? "border-evidence-red shadow-[0_0_0_1px_rgba(179,57,47,0.6),0_0_24px_rgba(179,57,47,0.35)]"
          : "border-brass-600/30 hover:border-brass-500/60"
      }`}
    >
      <div className="aspect-[16/10] w-full bg-[radial-gradient(circle_at_40%_28%,#3a322a_0%,#1a1510_55%,#0a0806_100%)]" />
      <div className="p-4">
        <p className="font-display text-lg text-parchment-100">{suspect.name}</p>
        <p className="mt-1 text-xs text-parchment-300/60">
          {suspect.age}세 · {suspect.job}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-parchment-300/50">{suspect.relationship}</p>
      </div>
    </button>
  );
}
