"use client";

import { REGIONS } from "@/features/region/constants";
import type { RegionId } from "@/features/region/types";

type RegionMapProps = {
  selectedRegionId: RegionId;
  onSelectRegion: (id: RegionId) => void;
};

export function RegionMap({ selectedRegionId, onSelectRegion }: RegionMapProps) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-brass-600/40 bg-noir-900/70">
      {/* 남한 실루엣 느낌의 배경 도형 */}
      <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full opacity-80" aria-hidden>
        <path
          d="M42,4 C55,2 62,10 60,20 C68,24 74,30 72,40 C80,46 78,58 70,64 C74,72 68,82 58,84 C56,94 46,102 38,98 C30,104 20,100 18,90 C10,86 8,76 14,68 C8,60 10,50 18,46 C16,36 22,26 32,24 C30,14 34,6 42,4 Z"
          className="fill-noir-700/60 stroke-brass-600/30"
          strokeWidth={0.6}
        />
        <ellipse cx="26" cy="116" rx="7" ry="4.5" className="fill-noir-700/60 stroke-brass-600/30" strokeWidth={0.6} />
      </svg>

      {REGIONS.map((region) => {
        const isSelected = region.id === selectedRegionId;
        return (
          <button
            key={region.id}
            type="button"
            onClick={() => onSelectRegion(region.id)}
            style={{ top: region.markerPosition.top, left: region.markerPosition.left }}
            className="group absolute -translate-x-1/2 -translate-y-full"
          >
            <span
              aria-hidden
              className={`block h-6 w-6 rounded-full border-2 shadow-[0_4px_10px_rgba(0,0,0,0.6)] transition-transform group-hover:scale-110 ${
                isSelected
                  ? "border-parchment-100 bg-evidence-red"
                  : "border-brass-500/70 bg-noir-800"
              }`}
            />
            <span
              aria-hidden
              className={`mx-auto block h-2 w-0.5 ${isSelected ? "bg-evidence-red" : "bg-brass-500/70"}`}
            />
            <span
              className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs font-medium ${
                isSelected ? "text-parchment-100" : "text-parchment-300/70"
              }`}
            >
              {region.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
