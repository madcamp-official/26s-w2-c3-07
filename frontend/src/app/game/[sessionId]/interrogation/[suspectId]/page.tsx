'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { PublicSuspect } from '@/types/content';
import type { InterrogationMessage, InterrogationResponse } from '@/types/interrogation';
import type { SessionView } from '@/types/session';
import type { Clue, Evidence } from '@/types/clue';
import { ApiError } from '@/types/api';
import { SuspectPortrait } from '@/features/interrogation/components/SuspectPortrait';
import { EvidenceSelector } from '@/features/interrogation/components/EvidenceSelector';
import { ClueUnlockNotice } from '@/features/interrogation/components/ClueUnlockNotice';

export default function InterrogationPage() {
  const { sessionId, suspectId } = useParams<{ sessionId: string; suspectId: string }>();
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`); const suspect = useApiResource<PublicSuspect>(session.data ? `/episodes/${session.data.episodeId}/suspects/${suspectId}` : null);
  const messages = useApiResource<InterrogationMessage[]>(`/sessions/${sessionId}/suspects/${suspectId}/interrogations`); const clues = useApiResource<Clue[]>(`/sessions/${sessionId}/clues`); const evidence = useApiResource<Evidence[]>(`/sessions/${sessionId}/evidence`);
  const [question, setQuestion] = useState(''); const [requestId, setRequestId] = useState<string | null>(null); const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]); const [unlockedClues, setUnlockedClues] = useState<InterrogationResponse['newlyUnlockedClues']>([]); const [sending, setSending] = useState(false); const [error, setError] = useState<ApiError | null>(null);
  const state = session.data?.suspectStates.find((item) => item.suspectId === suspectId); const disabled = sending || !session.data || session.data.remainingQuestions <= 0 || !['READY','INVESTIGATING','INTERROGATING'].includes(session.data.status);
  async function send(event: FormEvent) { event.preventDefault(); if (disabled || question.trim().length < 2) return; const id = requestId ?? crypto.randomUUID(); setRequestId(id); setSending(true); setError(null); try { const result = await api.post<InterrogationResponse>(`/sessions/${sessionId}/interrogations`, { requestId: id, suspectId, question: question.trim(), presentedEvidenceIds: selectedEvidenceIds }); if (result.newlyUnlockedClues.length) { setUnlockedClues((current) => [...new Map([...current, ...result.newlyUnlockedClues].map((clue) => [clue.id, clue])).values()]); clues.setData((current) => { if (!current) return current; const known = new Set(current.map((clue) => clue.id)); return [...current, ...result.newlyUnlockedClues.filter((clue) => !known.has(clue.id)).map((clue) => ({ ...clue, description: clue.content, unlockedAt: new Date().toISOString(), source: 'INTERROGATION' }))]; }); window.dispatchEvent(new CustomEvent('satoori:clues-updated', { detail: { sessionId } })); } setQuestion(''); setSelectedEvidenceIds([]); setRequestId(null); await Promise.all([messages.reload(), session.reload(), clues.reload()]); } catch (cause) { setError(cause as ApiError); } finally { setSending(false); } }
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6"><Link href={`/game/${sessionId}`}>← 용의자 목록</Link>
    {suspect.loading || session.loading ? <LoadingState /> : suspect.error ? <ErrorState error={suspect.error} /> : suspect.data && session.data && <><SuspectPortrait suspect={suspect.data} /><header className="text-center"><p className="text-xs text-evidence-red">INTERROGATION</p><h1 className="font-display text-4xl">{suspect.data.name}</h1><p className="opacity-60">{suspect.data.occupation} · 감정 {state?.emotion ?? suspect.data.initialEmotion}</p><p className="mt-2">전체 남은 질문 {session.data.remainingQuestions}회</p></header>
      <ClueUnlockNotice clues={unlockedClues} onDismiss={() => setUnlockedClues([])} />
      <section aria-label="심문 기록" className="space-y-4">{!messages.data?.length ? <EmptyState label="아직 심문 기록이 없습니다." /> : messages.data.map((message) => <article key={message.id} className="space-y-2"><div className="ml-auto max-w-[85%] bg-[#e9dfc7] p-3 text-noir-900">{message.question}</div><div className="max-w-[85%] border border-brass-600/30 bg-noir-900 p-4"><p>{message.dialectResponse}</p><p className="mt-2 text-xs opacity-50">감정 {message.emotionAfter} · {message.questionType}{message.evasionType === 'PROMPT_REJECTION' ? ' · 안전하지 않은 요청 차단' : ''}</p></div></article>)}</section>
      <EvidenceSelector evidence={evidence.data ?? []} selectedIds={selectedEvidenceIds} onChange={setSelectedEvidenceIds} disabled={sending} />
      {error && <ErrorState error={error} retry={() => void send({ preventDefault() {} } as FormEvent)} />}
      <form onSubmit={send} className="flex gap-2"><input aria-label="질문" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={disabled} maxLength={500} className="flex-1 border border-brass-600/40 bg-noir-900 px-4 py-3" placeholder={session.data.remainingQuestions ? '질문을 입력하세요' : '질문 횟수를 모두 사용했습니다'} /><button disabled={disabled || question.trim().length < 2} className="bg-evidence-red px-6 font-bold disabled:opacity-40">{sending ? '전송 중' : '질문'}</button></form>
    </>}</div></main></AuthGuard>;
}
