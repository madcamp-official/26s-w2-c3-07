'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { CaseBriefingHeader } from '@/features/episode/components/CaseBriefingHeader';
import { VictimSummaryCard } from '@/features/episode/components/VictimSummaryCard';
import { EvidenceGrid } from '@/features/episode/components/EvidenceGrid';
import { SuspectPreviewStrip } from '@/features/episode/components/SuspectPreviewStrip';
import type { EpisodeDetail, PublicSuspect, Scene } from '@/types/content';
import type { SessionView } from '@/types/session';
import { ApiError } from '@/types/api';

export default function EpisodePage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const router = useRouter();
  const detail = useApiResource<EpisodeDetail>(`/episodes/${episodeId}`);
  const scene = useApiResource<Scene>(`/episodes/${episodeId}/scene`);
  const suspects = useApiResource<PublicSuspect[]>(`/episodes/${episodeId}/suspects`);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<ApiError | null>(null);
  async function start() { if (starting) return; setStarting(true); setStartError(null); try { const session = await api.post<SessionView>('/sessions', { episodeId, difficulty }); router.push(`/game/${session.sessionId}`); } catch (cause) { setStartError(cause as ApiError); setStarting(false); } }

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-4xl space-y-7"><Link href="/regions" className="text-sm opacity-70">← 지역 목록</Link>
    {detail.loading ? <LoadingState /> : detail.error ? <ErrorState error={detail.error} retry={detail.reload} /> : detail.data ? <><CaseBriefingHeader episode={detail.data}/><VictimSummaryCard victim={detail.data.victim}/>{scene.data && (scene.data.evidence.length ? <EvidenceGrid evidence={scene.data.evidence}/> : <EmptyState label="공개된 초기 증거가 없습니다." />)}{suspects.data && <><SuspectPreviewStrip suspects={suspects.data}/><Link className="inline-block text-sm text-brass-400" href={`/episodes/${episodeId}/suspects`}>용의자 공개 정보 자세히 보기 →</Link></>}
      <section className="border-t border-brass-600/30 pt-6"><h2 className="mb-3 font-display text-xl">수사 난이도</h2><div className="flex flex-wrap gap-2">{detail.data.difficulties.map((item) => <button key={item.difficulty} type="button" onClick={() => setDifficulty(item.difficulty)} className={`border px-4 py-2 ${difficulty === item.difficulty ? 'border-evidence-red bg-evidence-red' : 'border-brass-600/40'}`}>{item.difficulty} · 총 {item.totalQuestions}회</button>)}</div>{startError && <div className="mt-4"><ErrorState error={startError}/></div>}<button type="button" onClick={start} disabled={starting} className="mt-5 w-full bg-evidence-red py-4 font-display text-lg font-bold disabled:opacity-50">{starting ? '세션 생성 중...' : '사건 조사 시작'}</button></section>
    </> : null}
  </div></main></AuthGuard>;
}
