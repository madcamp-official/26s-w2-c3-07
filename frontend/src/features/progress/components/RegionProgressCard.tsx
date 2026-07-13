import Link from 'next/link';
import type { EpisodeProgress } from '@/types/progress';

const STATUS_LABEL: Record<EpisodeProgress['state'], string> = { NOT_STARTED: '미도전', IN_PROGRESS: '수사 중', COMPLETED: '완료' };
const STATUS_STYLE: Record<EpisodeProgress['state'], string> = { NOT_STARTED: 'border-brass-600/30 text-parchment-300/50', IN_PROGRESS: 'border-brass-500 bg-brass-600/10 text-brass-400', COMPLETED: 'border-evidence-red bg-evidence-red/15 text-evidence-red' };

export function RegionProgressCard({ episode }: { episode: EpisodeProgress }) {
  return <Link href={`/episodes/${episode.episodeId}`} className="flex items-center gap-5 border border-brass-600/40 bg-noir-800/80 p-5 transition-colors hover:border-brass-400"><span className="grid h-12 w-12 shrink-0 place-items-center border border-brass-600/30 font-display text-sm text-brass-400" aria-hidden>{episode.region.code}</span><div className="min-w-0 flex-1"><p className="font-display text-lg text-parchment-100">{episode.region.name}</p><p className="mt-1 text-xs text-parchment-300/60">{episode.title}</p><p className="mt-1 text-xs text-parchment-300/40">최고 난이도 {episode.bestDifficulty ?? '-'} · 최고 점수 {episode.bestScore ?? '-'}</p></div><span className={`shrink-0 border px-3 py-1.5 text-xs font-bold ${STATUS_STYLE[episode.state]}`}>{STATUS_LABEL[episode.state]}</span></Link>;
}
