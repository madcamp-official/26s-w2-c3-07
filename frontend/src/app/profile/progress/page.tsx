'use client';

import Link from 'next/link';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { RegionProgressCard } from '@/features/progress/components/RegionProgressCard';
import type { EpisodeProgress, ProgressSummary } from '@/types/progress';

export default function ProgressPage() {
  const summary = useApiResource<ProgressSummary>('/progress');
  const episodes = useApiResource<EpisodeProgress[]>('/progress/episodes');
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6"><Link href="/profile">← 프로필</Link><header><p className="text-xs text-evidence-red">REGION PROGRESS</p><h1 className="font-display text-4xl">지역별 진행도</h1>{summary.data && <p className="mt-2 text-sm text-parchment-300/60">해결 사건 {summary.data.solvedEpisodeCount} · 완료 사건 {summary.data.completedEpisodeCount}</p>}</header>{episodes.loading ? <LoadingState/> : episodes.error ? <ErrorState error={episodes.error}/> : !episodes.data?.length ? <EmptyState label="공개된 사건이 없습니다."/> : <div className="space-y-3">{episodes.data.map((episode) => <RegionProgressCard key={episode.episodeId} episode={episode}/>)}</div>}</div></main></AuthGuard>;
}
