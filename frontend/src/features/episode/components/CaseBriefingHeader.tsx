import type { EpisodeDetail } from '@/types/content';

export function CaseBriefingHeader({ episode }: { episode: EpisodeDetail }) {
  return <header className="border-b border-brass-600/30 pb-6 text-center">
    <p className="text-xs font-bold tracking-widest text-evidence-red">{episode.code} · CASE FILE</p>
    <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">{episode.title}</h1>
    <p className="mt-2 text-sm text-parchment-300/60">{episode.location ?? '장소 미상'} · {episode.incidentType ?? '사건'}</p>
    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-parchment-300/80">{episode.synopsis}</p>
  </header>;
}
