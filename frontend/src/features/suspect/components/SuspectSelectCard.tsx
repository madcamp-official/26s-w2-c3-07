import Image from "next/image";
import type { Suspect } from "@/features/case/types";

type SuspectSelectCardProps = {
  suspect: Suspect;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function SuspectSelectCard({ suspect, isSelected, onSelect }: SuspectSelectCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(suspect.id)}
      className={`group relative overflow-hidden border bg-noir-900/60 transition-colors ${
        isSelected
          ? "border-evidence-red shadow-[0_0_0_1px_rgba(179,57,47,0.6),0_0_24px_rgba(179,57,47,0.35)]"
          : "border-brass-600/30 hover:border-brass-500/60"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(circle_at_40%_28%,#3a322a_0%,#1a1510_55%,#0a0806_100%)]">
        <Image
          src={`/images/suspects/${suspect.id}.png`}
          alt={suspect.name}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover object-top"
        />
      </div>

      <div className="p-4">
        <div
          className={`border px-4 py-2 text-center font-display text-lg ${
            isSelected ? "border-brass-500 bg-noir-800/80 text-parchment-100" : "border-brass-600/30 bg-noir-800/60 text-parchment-200"
          }`}
        >
          {suspect.name}
        </div>
      </div>
    </button>
  );
}
