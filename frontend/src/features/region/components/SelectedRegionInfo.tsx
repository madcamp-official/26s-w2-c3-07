import type { Region } from '@/types/content';

export function SelectedRegionInfo({ region }: { region: Region | null }) {
  return <div className="border border-brass-600/40 bg-noir-800/85 p-4 text-sm text-parchment-300"><p className="mb-2 font-display text-parchment-100">선택한 지역</p>{region ? <><p className="text-brass-400">{region.name}</p><p className="mt-1 text-xs text-parchment-300/60">{region.description}</p></> : <p className="leading-relaxed text-parchment-300/70">지역을 선택하면 공개 사건 목록을 확인할 수 있습니다.</p>}</div>;
}
