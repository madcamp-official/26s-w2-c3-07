import Link from 'next/link';
import type { EpisodeSummary, Region } from '@/types/content';

type CasePanelProps = { episode: EpisodeSummary; region: Region };

export function CasePanel({ episode, region }: CasePanelProps) {
  return <article className="relative border border-brass-600/40 bg-[#e9dfc7] text-noir-900 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
    <div className="flex items-center justify-between border-b border-noir-900/15 px-6 py-4"><span className="border-2 border-evidence-red px-3 py-1 font-display text-lg font-bold text-evidence-red">{region.name}</span><span className="text-xs font-bold tracking-widest text-noir-900/50">{episode.code}</span></div>
    <div className="flex flex-col gap-6 p-6 md:flex-row">
      <div className="h-48 w-full shrink-0 bg-[radial-gradient(circle_at_35%_30%,#4a3f30_0%,#241e17_60%,#100d09_100%)] md:h-auto md:w-64" />
      <div className="flex flex-1 flex-col justify-between gap-4"><div><p className="text-sm font-bold tracking-widest text-evidence-red">CASE FILE</p><h2 className="mt-1 font-display text-2xl font-bold">{episode.title}</h2><p className="mt-1 text-sm text-noir-900/60">{episode.location ?? '장소 미상'} · {episode.incidentType ?? '사건'}</p><p className="mt-3 text-sm leading-relaxed text-noir-900/80">{episode.synopsis}</p></div>
        <div className="flex items-end justify-between gap-4"><p className="text-sm text-noir-900/70">예상 수사 시간 <b>{episode.estimatedPlayMinutes}분</b><br />진행 상태 {episode.progressStatus ?? '미시작'}</p><Link href={`/episodes/${episode.id}`} className="shrink-0 bg-noir-900 px-6 py-3 font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-noir-800">사건 선택</Link></div>
      </div>
    </div>
  </article>;
}
