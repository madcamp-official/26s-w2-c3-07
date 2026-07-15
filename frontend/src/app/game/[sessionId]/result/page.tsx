'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import { AppHeader } from '@/components/layout/AppHeader';
import { resolveEndingImage } from '@/features/episode/utils/endingImage';
import type { DeductionResult, Ending } from '@/types/deduction';
import { ApiError } from '@/types/api';
import { playSfx } from '@/features/settings/audio';
import { useSfxEnabled } from '@/features/settings/useBgm';
import { useResolvedSessionRoute } from '@/features/session/useResolvedSessionRoute';

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const route = useResolvedSessionRoute(sessionId, 'completed');
  const actualSessionId = route.data?.sessionId;
  const result = useApiResource<DeductionResult>(actualSessionId ? `/sessions/${actualSessionId}/result` : null);
  const ending = useApiResource<Ending>(actualSessionId ? `/sessions/${actualSessionId}/ending` : null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const sfxEnabled = useSfxEnabled();
  const playedEndingSfx = useRef(false);
  useEffect(() => {
    if (!result.data || playedEndingSfx.current) return;
    playedEndingSfx.current = true;
    playSfx(result.data.isCorrect ? 'success' : 'failure', sfxEnabled);
  }, [result.data, sfxEnabled]);
  async function report() {
    if (!actualSessionId) return;
    setGenerating(true); setError(null);
    try { await api.post(`/sessions/${actualSessionId}/ending/report`); await ending.reload(); }
    catch (cause) { console.error('보고서 생성 실패', cause); setError(cause as ApiError); }
    finally { setGenerating(false); }
  }
  const endingImage = result.data && ending.data
    ? resolveEndingImage(ending.data.selectedSuspect.code, result.data.isCorrect)
    : null;
  if (route.loading) return <LoadingState label="게임 주소를 확인하는 중..." />;
  if (route.error) return <ErrorState error={route.error} retry={route.reload} message="완료된 게임 세션을 찾을 수 없습니다." />;
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-12 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6"><AppHeader />
    {result.loading || ending.loading ? <LoadingState label="판정과 엔딩을 불러오는 중..." /> : result.error ? <ErrorState error={result.error} message="추리 결과를 불러오지 못했습니다." /> : ending.error ? <ErrorState error={ending.error} message="사건 결말을 불러오지 못했습니다." /> : result.data && ending.data && <>
      {endingImage && <div className="relative aspect-[4/3] w-full overflow-hidden border border-brass-600/30"><Image src={endingImage} alt={ending.data.title} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" /></div>}
      <header className="text-center">
        <h1 className="font-display text-5xl text-evidence-red">
          {result.data.isCorrect ? '범인 지목 성공' : '잘못된 용의자 지목'}
        </h1>
      </header>
      <section className="border-l-4 border-evidence-red bg-[#e9dfc7] p-6 text-noir-900">{ending.data.fixedContent}</section>
      <section className="border p-5"><h2 className="font-display text-2xl">사건의 진상</h2><p className="mt-3">실제 범인: {ending.data.actualCulprit.name}</p><p>동기: {ending.data.motive ?? '확인되지 않음'}</p><p>범행 방법: {ending.data.crimeMethod ?? '확인되지 않음'}</p></section>
      <section><h2 className="font-display text-2xl">전체 타임라인</h2>{ending.data.fullTimeline.map((item, index) => <p key={`${item.occurredAt}-${index}`} className="mt-2 border-l-2 border-brass-400 pl-3"><b>{item.occurredAt}</b> {item.description}</p>)}</section>
      {ending.data.reportText ? <section className="border border-brass-600/30 p-5"><h2 className="font-display text-2xl">형사 보고서</h2><p className="mt-3 whitespace-pre-wrap">{ending.data.reportText}</p><p className="mt-4 whitespace-pre-wrap opacity-70">{ending.data.aftermathText}</p></section> : <button onClick={report} disabled={generating} className="w-full border border-brass-400 py-3">{generating ? '보고서 생성 중...' : '형사 보고서 생성'}</button>}
      {error && <ErrorState error={error} message="보고서를 생성하지 못했습니다. 다시 시도해 주세요." />}
      <Link href="/regions" className="block bg-evidence-red py-4 text-center font-bold">다른 사건 수사하기</Link>
    </>}
  </div></main></AuthGuard>;
}
