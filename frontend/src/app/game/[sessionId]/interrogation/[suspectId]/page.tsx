'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { emotionLabel, questionTypeLabel } from '@/lib/game-labels';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { PublicSuspect } from '@/types/content';
import type { InterrogationMessage, InterrogationResponse } from '@/types/interrogation';
import type { SessionView } from '@/types/session';
import type { Clue } from '@/types/clue';
import { ApiError } from '@/types/api';
import { SuspectPortrait } from '@/features/interrogation/components/SuspectPortrait';
import { AppHeader } from '@/components/layout/AppHeader';
import { ClueModal } from '@/components/ui/ClueModal';

export default function InterrogationPage() {
  const { sessionId, suspectId } = useParams<{ sessionId: string; suspectId: string }>();
  const evidenceId = useSearchParams().get('evidenceId');
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`);
  const suspect = useApiResource<PublicSuspect>(session.data ? `/episodes/${session.data.episodeId}/suspects/${suspectId}` : null);
  const messages = useApiResource<InterrogationMessage[]>(`/sessions/${sessionId}/suspects/${suspectId}/interrogations`);
  const clues = useApiResource<Clue[]>(`/sessions/${sessionId}/clues`);
  const [question, setQuestion] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState('');
  const [clueModalOpen, setClueModalOpen] = useState(false);
  const [newClueIds, setNewClueIds] = useState<string[]>([]);
  const state = session.data?.suspectStates.find((item) => item.suspectId === suspectId);
  const suspectQuestionsRemaining = state?.questionsRemaining ?? session.data?.questionsPerSuspect ?? 0;
  const disabled = sending || !session.data || session.data.remainingQuestions <= 0 || suspectQuestionsRemaining <= 0 || !['READY', 'INVESTIGATING', 'INTERROGATING'].includes(session.data.status);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (disabled || question.trim().length < 2) return;
    const id = requestId ?? crypto.randomUUID();
    setRequestId(id);
    setSending(true);
    setError(null);
    try {
      const result = await api.post<InterrogationResponse>(`/sessions/${sessionId}/interrogations`, {
        requestId: id, suspectId, question: question.trim(), presentedEvidenceIds: evidenceId ? [evidenceId] : []
      });
      const unlockedClues = Array.isArray(result.newlyUnlockedClues) ? result.newlyUnlockedClues : [];
      setNewClueIds(unlockedClues.map((clue) => clue.id));
      const notices = [
        unlockedClues.length ? `새로운 단서를 획득했습니다. 단서: ${unlockedClues.map((clue) => clue.title).join(', ')}` : '',
        result.newlyUnlockedEvidence.length ? `새 증거 ${result.newlyUnlockedEvidence.length}개` : ''
      ].filter(Boolean);
      setNotice(notices.length ? `${notices.join(', ')}를 획득했습니다.` : '');
      setQuestion('');
      setRequestId(null);
      await Promise.all([messages.reload(), session.reload(), clues.reload()]);
    } catch (cause) {
      console.error('질문 처리 실패', cause);
      setError(cause as ApiError);
    } finally {
      setSending(false);
    }
  }

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6">
    <AppHeader /><Link href={`/game/${sessionId}`}>← 용의자 목록</Link>
    {suspect.loading || session.loading ? <LoadingState /> : suspect.error ? <ErrorState error={suspect.error} message="용의자 정보를 불러오지 못했습니다." /> : suspect.data && session.data && <>
      <SuspectPortrait suspect={suspect.data} />
      <header className="text-center">
        <p className="text-xs text-evidence-red">심문</p>
        <h1 className="font-display text-4xl">{suspect.data.name}</h1>
        <p className="opacity-60">{suspect.data.occupation} · 감정 {emotionLabel(state?.emotion)}</p>
        <p className="mt-2">전체 남은 질문 {session.data.remainingQuestions}회</p>
        <p className="mt-1 text-sm text-brass-400">이 용의자에게 질문 {suspectQuestionsRemaining}회 남음</p>
      </header>
      <button type="button" onClick={() => setClueModalOpen(true)} className="w-full border border-brass-600/30 p-3 text-left">획득한 단서 {clues.data?.length ?? 0}개 <span className="float-right text-xs opacity-60">목록 보기</span></button>
      {notice && <button type="button" role="status" onClick={() => setClueModalOpen(true)} className="w-full border border-brass-400 p-3 text-left">{notice}</button>}
      <section aria-label="심문 기록" className="space-y-4">
        {!messages.data?.length ? <EmptyState label="아직 심문 기록이 없습니다." /> : messages.data.map((message) => <article key={message.id} className="space-y-2">
          <div className="ml-auto max-w-[85%] bg-[#e9dfc7] p-3 text-noir-900">{message.question}</div>
          <div className="max-w-[85%] border border-brass-600/30 bg-noir-900 p-4">
            <p>{message.dialectResponse}</p>
            <p className="mt-2 text-xs opacity-50">감정 {message.emotionAfterLabel || emotionLabel(message.emotionAfter)} · {message.questionTypeLabel || questionTypeLabel(message.questionType)}{message.evasionType === 'PROMPT_REJECTION' ? ' · 안전하지 않은 요청 차단' : ''}</p>
          </div>
        </article>)}
      </section>
      {error && <ErrorState error={error} message="질문을 처리하지 못했습니다. 질문 횟수는 차감되지 않았습니다." retry={() => void send({ preventDefault() {} } as FormEvent)} />}
      {suspectQuestionsRemaining === 0 && <p role="status" className="border border-evidence-red/40 bg-evidence-red/10 p-3">이 용의자에게 가능한 질문을 모두 사용했습니다.</p>}
      <form onSubmit={send} className="flex gap-2">
        <input aria-label="질문" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={disabled} maxLength={500} className="flex-1 border border-brass-600/40 bg-noir-900 px-4 py-3" placeholder={suspectQuestionsRemaining ? '질문을 입력하세요' : '이 용의자에게 가능한 질문을 모두 사용했습니다'} />
        <button disabled={disabled || question.trim().length < 2} className="bg-evidence-red px-6 font-bold disabled:opacity-40">{sending ? '전송 중...' : '질문'}</button>
      </form>
      {clueModalOpen && <ClueModal clues={Array.isArray(clues.data) ? clues.data : []} highlightedIds={newClueIds} initialSelectedId={newClueIds[0] ?? null} onClose={() => setClueModalOpen(false)} />}
    </>}
  </div></main></AuthGuard>;
}
