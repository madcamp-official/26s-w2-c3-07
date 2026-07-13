'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { Region, EpisodeSummary } from '@/types/content';
import type { ProgressSummary } from '@/types/progress';
import type { SessionView } from '@/types/session';

export default function RegionsPage() {
  const regions = useApiResource<Region[]>('/regions');
  const progress = useApiResource<ProgressSummary>('/progress');
  const active = useApiResource<SessionView | null>('/sessions/active');
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { if (!selected && regions.data?.[0]) setSelected(regions.data[0].id); }, [regions.data, selected]);
  const episodes = useApiResource<EpisodeSummary[]>(selected ? `/regions/${selected}/episodes` : null);
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs tracking-widest text-evidence-red">CASE ARCHIVE</p><h1 className="font-display text-4xl font-bold">지역 및 사건 선택</h1></div><Link href="/profile" className="border border-brass-600/50 px-4 py-2">내 기록</Link></header>
      {active.data && <Link href={`/game/${active.data.sessionId}`} className="block border border-brass-400 bg-brass-600/10 p-4">진행 중인 사건 이어하기 · 남은 질문 {active.data.remainingQuestions}회 →</Link>}
      {progress.data && <section className="grid grid-cols-2 gap-3 md:grid-cols-5">{[
        ['플레이 사건', progress.data.playedEpisodeCount], ['완료 사건', progress.data.completedEpisodeCount], ['해결 사건', progress.data.solvedEpisodeCount], ['완전 해결', progress.data.fullResolutionCount], ['사투리', progress.data.unlockedDialectCount]
      ].map(([label, value]) => <div key={label} className="border border-brass-600/30 bg-noir-900/70 p-3 text-center"><b className="text-xl text-brass-400">{value}</b><p className="text-xs opacity-60">{label}</p></div>)}</section>}
      {regions.loading ? <LoadingState /> : regions.error ? <ErrorState error={regions.error} retry={regions.reload} /> : !regions.data?.length ? <EmptyState label="활성 지역이 없습니다." /> : <>
        <nav className="flex flex-wrap gap-3">{regions.data.map((region) => <button key={region.id} onClick={() => setSelected(region.id)} className={`border px-5 py-3 ${selected === region.id ? 'border-evidence-red bg-evidence-red' : 'border-brass-600/40 bg-noir-900'}`}>{region.name}</button>)}</nav>
        {episodes.loading ? <LoadingState label="사건 목록을 불러오는 중..." /> : episodes.error ? <ErrorState error={episodes.error} retry={episodes.reload} /> : !episodes.data?.length ? <EmptyState label="공개된 사건이 없습니다." /> : <section className="grid gap-5 md:grid-cols-2">{episodes.data.map((episode) => <article key={episode.id} className="border border-brass-600/30 bg-noir-900/70 p-6"><p className="text-xs text-evidence-red">{episode.code}</p><h2 className="mt-2 font-display text-2xl">{episode.title}</h2><p className="mt-2 text-sm opacity-70">{episode.synopsis}</p><p className="mt-4 text-xs opacity-50">예상 {episode.estimatedPlayMinutes}분 · {episode.progressStatus ?? '미시작'}</p><Link href={`/episodes/${episode.id}`} className="mt-5 inline-block bg-evidence-red px-5 py-2 font-bold">사건 보기 →</Link></article>)}</section>}
      </>}
    </div>
  </main></AuthGuard>;
}
