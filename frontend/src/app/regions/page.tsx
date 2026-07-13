'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { RegionMap } from '@/features/region/components/RegionMap';
import { SelectedRegionInfo } from '@/features/region/components/SelectedRegionInfo';
import { CasePanel } from '@/features/region/components/CasePanel';
import { CaseArchiveCard } from '@/features/region/components/CaseArchiveCard';
import type { EpisodeSummary, Region } from '@/types/content';
import type { ProgressSummary } from '@/types/progress';
import type { SessionView } from '@/types/session';

export default function RegionsPage() {
  const regions = useApiResource<Region[]>('/regions');
  const progress = useApiResource<ProgressSummary>('/progress');
  const active = useApiResource<SessionView | null>('/sessions/active');
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { if (!selected && regions.data?.[0]) setSelected(regions.data[0].id); }, [regions.data, selected]);
  const episodes = useApiResource<EpisodeSummary[]>(selected ? `/regions/${selected}/episodes` : null);
  const selectedRegion = regions.data?.find((region) => region.id === selected) ?? null;

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs tracking-widest text-evidence-red">CASE ARCHIVE</p><h1 className="font-display text-4xl font-bold">지역 및 사건 선택</h1></div><div className="flex items-start gap-4"><CaseArchiveCard solvedCount={progress.data?.solvedEpisodeCount ?? 0} totalCount={progress.data?.regionProgress.reduce((sum, item) => sum + item.totalEpisodes, 0) ?? 0} cluesCollected={progress.data?.unlockedDialectCount ?? 0} cluesTotal={progress.data?.unlockedDialectCount ?? 0}/><Link href="/profile" className="border border-brass-600/50 px-4 py-2">내 기록</Link></div></header>
    {active.data && <Link href={`/game/${active.data.sessionId}`} className="block border border-brass-400 bg-brass-600/10 p-4">진행 중인 사건 이어하기 · 남은 질문 {active.data.remainingQuestions}회</Link>}
    {regions.loading ? <LoadingState /> : regions.error ? <ErrorState error={regions.error} retry={regions.reload} /> : !regions.data?.length ? <EmptyState label="활성 지역이 없습니다." /> : <div className="grid gap-8 lg:grid-cols-[18rem_1fr]"><aside className="space-y-4"><RegionMap regions={regions.data} selectedRegionId={selected} onSelectRegion={setSelected}/><SelectedRegionInfo region={selectedRegion}/></aside><section className="space-y-5">{episodes.loading ? <LoadingState label="사건 목록을 불러오는 중..." /> : episodes.error ? <ErrorState error={episodes.error} retry={episodes.reload} /> : !episodes.data?.length ? <EmptyState label="공개된 사건이 없습니다." /> : selectedRegion && episodes.data.map((episode) => <CasePanel key={episode.id} episode={episode} region={selectedRegion}/>)}</section></div>}
  </div></main></AuthGuard>;
}
