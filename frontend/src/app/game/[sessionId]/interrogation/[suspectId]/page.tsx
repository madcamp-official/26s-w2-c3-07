'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import { SuspectPortrait } from '@/features/interrogation/components/SuspectPortrait';
import { ConversationLog } from '@/features/interrogation/components/ConversationLog';
import { QuestionsLeftBadge } from '@/features/interrogation/components/QuestionsLeftBadge';
import { QuestionInputBar } from '@/features/interrogation/components/QuestionInputBar';
import type { PublicSuspect } from '@/types/content';
import type { InterrogationMessage } from '@/types/interrogation';
import type { SessionView } from '@/types/session';
import type { Clue } from '@/types/clue';
import { ApiError } from '@/types/api';

export default function InterrogationPage() {
  const { sessionId, suspectId } = useParams<{ sessionId: string; suspectId: string }>();
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`);
  const suspect = useApiResource<PublicSuspect>(session.data ? `/episodes/${session.data.episodeId}/suspects/${suspectId}` : null);
  const messages = useApiResource<InterrogationMessage[]>(`/sessions/${sessionId}/suspects/${suspectId}/interrogations`);
  const clues = useApiResource<Clue[]>(`/sessions/${sessionId}/clues`);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ requestId: string; question: string } | null>(null);
  const state = session.data?.suspectStates.find((item) => item.suspectId === suspectId);
  const disabled = sending || !session.data || session.data.remainingQuestions <= 0 || !['READY', 'INVESTIGATING', 'INTERROGATING'].includes(session.data.status);
  async function send(question: string, existingRequestId?: string) { if (disabled || question.trim().length < 2) return; const requestId = existingRequestId ?? crypto.randomUUID(); setPending({ requestId, question }); setSending(true); setError(null); const before = clues.data?.length ?? 0; try { await api.post<InterrogationMessage>(`/sessions/${sessionId}/interrogations`, { requestId, suspectId, question: question.trim() }); setPending(null); await Promise.all([messages.reload(), session.reload()]); const refreshedClues = await clues.reload(); const after = refreshedClues?.length ?? before; if (after > before) setNotice(`새 단서 ${after - before}개를 획득했습니다.`); } catch (cause) { setError(cause as ApiError); } finally { setSending(false); } }

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-4xl space-y-6"><Link href={`/game/${sessionId}`}>← 용의자 목록</Link>{suspect.loading || session.loading ? <LoadingState /> : suspect.error ? <ErrorState error={suspect.error} /> : suspect.data && session.data && <>
    <header className="text-center"><p className="text-xs text-evidence-red">INTERROGATION</p><h1 className="font-display text-4xl">{suspect.data.name}</h1><p className="opacity-60">{suspect.data.occupation} · 감정 {state?.emotion ?? suspect.data.initialEmotion}</p></header>
    <SuspectPortrait suspect={suspect.data}/><QuestionsLeftBadge left={session.data.remainingQuestions} total={session.data.remainingQuestions + (state?.questionsAsked ?? 0)}/>{notice && <p role="status" className="border border-brass-400 p-3">{notice}</p>}<ConversationLog messages={messages.data ?? []}/>{error && <ErrorState error={error} retry={pending ? () => void send(pending.question, pending.requestId) : undefined}/>}<QuestionInputBar onSubmit={(question) => void send(question)} disabled={disabled}/>
  </>}</div></main></AuthGuard>;
}
