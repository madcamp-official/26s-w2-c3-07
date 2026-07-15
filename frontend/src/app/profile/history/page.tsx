'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { AppHeader } from '@/components/layout/AppHeader';
import { difficultyLabel, resolutionLabel } from '@/lib/game-labels';
import type { HistoryPage as HistoryPageData } from '@/types/progress';

export default function HistoryPage() {
  const search = useSearchParams();
  const page = Math.max(1, Number(search.get('page') ?? 1));
  const data = useApiResource<HistoryPageData>(`/progress/history?page=${page}&pageSize=10`);
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6">
    <AppHeader /><Link href="/profile">← 프로필</Link><h1 className="font-display text-4xl">플레이 이력</h1>
    {data.loading ? <LoadingState /> : data.error ? <ErrorState error={data.error} message="플레이 이력을 불러오지 못했습니다." /> : !data.data?.items.length ? <EmptyState label="완료한 플레이가 없습니다." /> : <>
      {data.data.items.map((item) => <article key={item.sessionId} className="border border-brass-600/30 p-5"><div className="flex justify-between"><h2 className="font-display text-xl">{item.episode.title}</h2><b className={item.isCorrect ? 'text-brass-400' : 'text-evidence-red'}>{item.isCorrect ? '정답' : '오답'}</b></div><p className="text-sm opacity-60">{item.episode.region.name} · {difficultyLabel(item.difficulty)} · {resolutionLabel(item.resolutionType)}</p><p className="mt-2">지목: {item.selectedSuspect.name} · 점수 {item.score}</p><Link className="mt-2 inline-block text-brass-400" href={`/game/${item.sessionId}/result`}>결과 다시 보기</Link></article>)}
      <nav className="flex justify-between"><Link aria-disabled={page <= 1} className={page <= 1 ? 'pointer-events-none opacity-30' : ''} href={`?page=${page - 1}`}>← 이전</Link><span>{page} / {data.data.totalPages || 1}</span><Link aria-disabled={page >= data.data.totalPages} className={page >= data.data.totalPages ? 'pointer-events-none opacity-30' : ''} href={`?page=${page + 1}`}>다음 →</Link></nav>
    </>}
  </div></main></AuthGuard>;
}
