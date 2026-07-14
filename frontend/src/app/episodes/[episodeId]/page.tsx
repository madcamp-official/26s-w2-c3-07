'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { EpisodeDetail, PublicSuspect, Scene } from '@/types/content';
import type { SessionView } from '@/types/session';
import { ApiError } from '@/types/api';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';
import { AppHeader } from '@/components/layout/AppHeader';

export default function EpisodePage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const router = useRouter();
  const detail = useApiResource<EpisodeDetail>(`/episodes/${episodeId}`);
  const scene = useApiResource<Scene>(`/episodes/${episodeId}/scene`);
  const suspects = useApiResource<PublicSuspect[]>(`/episodes/${episodeId}/suspects`);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [starting, setStarting] = useState(false); const [startError, setStartError] = useState<ApiError | null>(null);
  async function start() { if (starting) return; setStarting(true); setStartError(null); try { const session = await api.post<SessionView>('/sessions', { episodeId, difficulty }); router.push(`/game/${session.sessionId}`); } catch (cause) { setStartError(cause as ApiError); setStarting(false); } }
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-7">
    <AppHeader />
    <Link href="/regions" className="text-sm opacity-70">← 지역 목록</Link>
    {detail.loading ? <LoadingState /> : detail.error ? <ErrorState error={detail.error} retry={detail.reload} /> : detail.data ? <>
      <header><p className="text-xs text-evidence-red">{detail.data.code} · {detail.data.incidentType}</p><h1 className="mt-2 font-display text-4xl">{detail.data.title}</h1><p className="mt-3 opacity-70">{detail.data.synopsis}</p></header>
      <section className="border border-brass-600/30 bg-noir-900/70 p-5"><h2 className="font-bold text-brass-400">피해자</h2><p className="mt-2">{detail.data.victim.name} · {detail.data.victim.age ?? '나이 미상'}세 · {detail.data.victim.occupation ?? '직업 미상'}</p></section>
      {scene.data && <section><h2 className="mb-3 font-display text-2xl">초기 현장 증거</h2>{scene.data.evidence.length ? <div className="grid gap-3 md:grid-cols-2">{scene.data.evidence.map((item) => <div key={item.id} className="border border-brass-600/30 p-4"><b>{item.title}</b><p className="mt-1 text-sm opacity-60">{item.description}</p></div>)}</div> : <EmptyState label="공개된 초기 증거가 없습니다." />}</section>}
      {suspects.data && <section><h2 className="mb-3 font-display text-2xl">용의자 {suspects.data.length}명</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{suspects.data.map((item) => <div key={item.id} className="overflow-hidden border border-brass-600/30 bg-noir-900/70"><SuspectImage imageUrl={item.imageUrl} name={item.name} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-square w-full" /><p className="px-3 py-2 text-center font-display">{item.name}</p></div>)}</div><Link className="mt-3 inline-block text-sm text-brass-400" href={`/episodes/${episodeId}/suspects`}>용의자 공개 정보 보기 →</Link></section>}
      <section className="border-t border-brass-600/30 pt-6"><div className="flex flex-wrap gap-2">{detail.data.difficulties.map((item) => <button key={item.difficulty} onClick={() => setDifficulty(item.difficulty)} className={`border px-4 py-2 ${difficulty === item.difficulty ? 'border-evidence-red bg-evidence-red' : 'border-brass-600/40'}`}>{item.difficulty} · 총 {item.totalQuestions}회</button>)}</div>{startError && <div className="mt-4"><ErrorState error={startError} /></div>}<button onClick={start} disabled={starting} className="mt-5 w-full bg-evidence-red py-4 font-display text-lg font-bold disabled:opacity-50">{starting ? '세션 생성 중...' : '사건 조사 시작'}</button></section>
    </> : null}
  </div></main></AuthGuard>;
}
