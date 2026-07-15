'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { AppHeader } from '@/components/layout/AppHeader';
import { resolveEpisodeImage } from '@/features/episode/utils/episodeImage';
import type { Region, EpisodeSummary } from '@/types/content';
import type { ProgressSummary } from '@/types/progress';
import type { SessionView } from '@/types/session';

const MAP_HOTSPOTS: Record<string, { top: string; left: string }> = {
  CC: { top: '36%', left: '46%' },
  JL: { top: '60%', left: '30%' },
  GS: { top: '56%', left: '63%' },
  JJ: { top: '95%', left: '23%' },
};

export default function RegionsPage() {
  const regions = useApiResource<Region[]>('/regions');
  const progress = useApiResource<ProgressSummary>('/progress');
  const active = useApiResource<SessionView | null>('/sessions/active');
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { if (!selected && regions.data?.[0]) setSelected(regions.data[0].id); }, [regions.data, selected]);
  const episodes = useApiResource<EpisodeSummary[]>(selected ? `/regions/${selected}/episodes` : null);
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100">
    <div className="mx-auto max-w-5xl space-y-8">
      <AppHeader />
      <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs tracking-widest text-evidence-red">사건 기록 보관소</p><h1 className="font-display text-4xl font-bold">지역 및 사건 선택</h1></div><Link href="/profile" className="border border-brass-600/50 px-4 py-2">내 기록</Link></header>
      {active.data && <Link href={`/game/${active.data.episodeCode}`} className="block border border-brass-400 bg-brass-600/10 p-4">진행 중인 사건 이어하기 · 남은 질문 {active.data.remainingQuestions}회 →</Link>}
      {progress.data && <section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
        ['완료 사건', progress.data.completedEpisodeCount], ['해결 사건', progress.data.solvedEpisodeCount], ['미해결 사건', progress.data.unresolvedEpisodeCount], ['현재 연승', progress.data.currentStreak]
      ].map(([label, value]) => <div key={label} className="border border-brass-600/30 bg-noir-900/70 p-3 text-center"><b className="text-xl text-brass-400">{value}</b><p className="text-xs opacity-60">{label}</p></div>)}</section>}
      {regions.loading ? <LoadingState /> : regions.error ? <ErrorState error={regions.error} retry={regions.reload} /> : !regions.data?.length ? <EmptyState label="활성 지역이 없습니다." /> : <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
        <section className="relative mx-auto aspect-[462/550] w-full max-w-xs rounded-lg border border-brass-600/30 bg-noir-900/70 p-4">
          <div className="relative h-full w-full">
            <Image src="/images/episodes/map.png" alt="대한민국 지역 지도" fill sizes="320px" className="object-contain opacity-90" />
            {regions.data.map((region) => {
              const spot = MAP_HOTSPOTS[region.code];
              if (!spot) return null;
              return (
                <button
                  key={region.id}
                  onClick={() => setSelected(region.id)}
                  style={{ top: spot.top, left: spot.left }}
                  className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1"
                >
                  <span aria-hidden className={`text-2xl drop-shadow ${selected === region.id ? 'text-evidence-red' : 'text-brass-400'}`}>📍</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold shadow ${selected === region.id ? 'bg-evidence-red text-parchment-100' : 'bg-noir-950/90 text-parchment-100'}`}>{region.name}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section>
          {episodes.loading ? <LoadingState label="사건 목록을 불러오는 중..." /> : episodes.error ? <ErrorState error={episodes.error} retry={episodes.reload} /> : !episodes.data?.length ? <EmptyState label="공개된 사건이 없습니다." /> : <div className="space-y-4">{episodes.data.map((episode) => { const image = resolveEpisodeImage(episode); return <article key={episode.id} className="overflow-hidden border border-brass-600/30 bg-noir-900/70">{image && <div className="relative aspect-[16/9] w-full overflow-hidden"><Image src={image} alt={episode.title} fill sizes="(min-width: 768px) 640px, 100vw" className="scale-105 object-cover" /></div>}<div className="p-6"><p className="text-xs text-evidence-red">{episode.code}</p><h2 className="mt-2 font-display text-2xl">{episode.title}</h2><p className="mt-2 text-sm opacity-70">{episode.synopsis}</p><p className="mt-4 text-xs opacity-50">예상 {episode.estimatedPlayMinutes}분 · {episode.progressStatus ?? '미시작'}</p><Link href={`/episodes/${episode.code}`} className="mt-5 inline-block bg-evidence-red px-5 py-2 font-bold">사건 보기 →</Link></div></article>; })}</div>}
        </section>
      </div>}
    </div>
  </main></AuthGuard>;
}
