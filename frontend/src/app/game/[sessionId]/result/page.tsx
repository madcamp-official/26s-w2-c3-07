'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { DeductionResult, Ending } from '@/types/deduction';
import { ApiError } from '@/types/api';

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const result = useApiResource<DeductionResult>(`/sessions/${sessionId}/result`);
  const ending = useApiResource<Ending>(`/sessions/${sessionId}/ending`);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  async function report() { setGenerating(true); setError(null); try { await api.post(`/sessions/${sessionId}/ending/report`); await ending.reload(); } catch (cause) { setError(cause as ApiError); } finally { setGenerating(false); } }

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-12 text-parchment-100"><div className="mx-auto max-w-4xl space-y-8">{result.loading || ending.loading ? <LoadingState label="판정과 엔딩을 불러오는 중..."/> : result.error ? <ErrorState error={result.error}/> : ending.error ? <ErrorState error={ending.error}/> : result.data && ending.data && <>
    <header className="border-b border-brass-600/30 pb-8 text-center"><p className="text-xs font-bold tracking-widest text-evidence-red">{result.data.resolutionType}</p><h1 className="mt-2 font-display text-5xl">{ending.data.title}</h1><p className="mt-3 text-lg text-parchment-300/70">{result.data.isCorrect ? '범인을 정확히 지목했습니다.' : '선택한 용의자는 범인이 아니었습니다.'}</p><p className="mt-2 text-sm text-brass-400">핵심 단서 {result.data.acquiredCoreClues} / {result.data.totalCoreClues}</p></header>
    <section className="border-l-4 border-evidence-red bg-[#e9dfc7] p-6 text-noir-900"><p className="whitespace-pre-wrap leading-relaxed">{ending.data.fixedContent}</p></section>
    <section className="grid gap-5 md:grid-cols-2"><article className="border border-brass-600/30 bg-noir-900/60 p-5"><p className="text-xs text-evidence-red">실제 범인</p><h2 className="mt-1 font-display text-2xl">{ending.data.actualCulprit.name}</h2><p className="mt-4 text-sm text-parchment-300/70">동기: {ending.data.motive ?? '확인되지 않음'}</p><p className="mt-2 text-sm text-parchment-300/70">범행 방법: {ending.data.crimeMethod ?? '확인되지 않음'}</p></article><article className="border border-brass-600/30 bg-noir-900/60 p-5"><p className="text-xs text-evidence-red">나의 지목</p><h2 className="mt-1 font-display text-2xl">{ending.data.selectedSuspect.name}</h2><p className="mt-4 text-sm text-parchment-300/70">{result.data.isCorrect ? '사건 해결' : '오답 엔딩'}</p></article></section>
    <section><h2 className="font-display text-2xl">사건의 전체 타임라인</h2><ol className="mt-4 space-y-3">{ending.data.fullTimeline.map((item, index) => <li key={`${item.occurredAt}-${index}`} className="border-l-2 border-brass-400 pl-4"><b>{item.occurredAt} · {item.title}</b><p className="mt-1 text-sm text-parchment-300/70">{item.description}</p></li>)}</ol></section>
    <section className="border border-brass-600/30 p-5"><h2 className="font-display text-2xl">사투리 해설</h2>{ending.data.dialectExplanations.map((item) => <p key={item.code} className="mt-3"><b className="text-brass-400">{item.dialectText}</b> → {item.standardText}<span className="text-parchment-300/60"> · {item.meaning}</span></p>)}</section>
    {ending.data.reportText ? <section className="border border-brass-600/30 bg-noir-900/60 p-5"><h2 className="font-display text-2xl">형사 보고서</h2><p className="mt-3 whitespace-pre-wrap">{ending.data.reportText}</p><p className="mt-4 whitespace-pre-wrap text-parchment-300/70">{ending.data.aftermathText}</p></section> : <button type="button" onClick={report} disabled={generating} className="w-full border border-brass-400 py-3">{generating ? '보고서 생성 중...' : '형사 보고서 생성'}</button>}
    {error && <ErrorState error={error}/>}<Link href="/regions" className="block bg-evidence-red py-4 text-center font-bold">다른 사건 수사하기</Link>
  </>}</div></main></AuthGuard>;
}
