import type { Region } from "@/features/region/types";

export function SelectedRegionInfo({ region }: { region: Region | null }) {
  return (
    <div className="border border-brass-600/40 bg-noir-800/85 p-4 text-sm text-parchment-300">
      <p className="mb-2 flex items-center gap-2 font-display text-parchment-100">
        <span aria-hidden className="text-evidence-red">
          📍
        </span>
        선택된 지역
      </p>
      {region ? (
        <p className="text-brass-400">{region.name}</p>
      ) : (
        <p className="leading-relaxed text-parchment-300/70">
          지역을 선택하면 해당 지역의 서 사건 목록을 볼 수 있습니다.
        </p>
      )}
    </div>
  );
}
