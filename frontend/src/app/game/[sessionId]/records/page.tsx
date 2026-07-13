'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { StepTabs } from '@/features/records/components/StepTabs';
import { ClueListPanel } from '@/features/records/components/ClueListPanel';
import { SuspectListPanel } from '@/features/records/components/SuspectListPanel';
import { TestimonyLogPanel } from '@/features/records/components/TestimonyLogPanel';
import { RECORD_STEPS } from '@/features/records/constants';
import type { InvestigationRecord, Note } from '@/types/record';
import { ApiError } from '@/types/api';

export default function RecordsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const record = useApiResource<InvestigationRecord>(`/sessions/${sessionId}/records`);
  const [step, setStep] = useState(1);
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  async function createNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (saving) return; const data = new FormData(event.currentTarget); setSaving(true); setError(null); try { await api.post<Note>(`/sessions/${sessionId}/notes`, { noteType: data.get('noteType'), content: data.get('content'), suspectId: null, relatedRef: {} }); event.currentTarget.reset(); await record.reload(); } catch (cause) { setError(cause as ApiError); } finally { setSaving(false); } }
  async function remove(noteId: string) { try { await api.delete(`/sessions/${sessionId}/notes/${noteId}`); await record.reload(); } catch (cause) { setError(cause as ApiError); } }

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-6"><header className="flex justify-between"><div><p className="text-xs text-evidence-red">INVESTIGATION RECORD</p><h1 className="font-display text-4xl">사건 기록</h1></div><Link href={`/game/${sessionId}`}>게임으로 →</Link></header><StepTabs steps={RECORD_STEPS} activeStepId={step} onSelectStep={setStep}/>{error && <ErrorState error={error}/>} {record.loading ? <LoadingState /> : record.error ? <ErrorState error={record.error} retry={record.reload} /> : record.data && <>
    {step === 1 && <div className="grid gap-5 md:grid-cols-[18rem_1fr]"><SuspectListPanel testimonies={record.data.testimonies} selectedSuspectId={selectedSuspectId} onSelectSuspect={setSelectedSuspectId}/><TestimonyLogPanel testimonies={record.data.testimonies} highlightedSuspectId={selectedSuspectId}/></div>}
    {step === 2 && <div className="grid gap-5 md:grid-cols-2"><section className="border border-brass-600/40 bg-noir-800/80 p-5"><h2 className="font-display text-xl">확인한 증거</h2>{record.data.evidence.length ? record.data.evidence.map((item) => <article key={item.id} className="mt-3 border border-brass-600/20 p-3"><b>{item.title}</b><p className="mt-1 text-xs opacity-60">{item.description}</p></article>) : <EmptyState label="확인한 증거가 없습니다."/>}</section><ClueListPanel clues={record.data.clues}/></div>}
    {step === 3 && <div className="grid gap-5 md:grid-cols-2"><section className="border border-brass-600/40 p-5"><h2 className="font-display text-xl">공개 타임라인</h2>{record.data.timeline.length ? <ol className="mt-4 space-y-3">{record.data.timeline.map((item) => <li key={item.id} className="border-l-2 border-brass-400 pl-4"><b>{item.occurredAt}</b><p className="text-sm opacity-70">{item.description}</p></li>)}</ol> : <EmptyState label="공개된 타임라인이 없습니다."/>}</section><section className="border border-brass-600/40 p-5"><h2 className="font-display text-xl">사투리 표현</h2>{record.data.dialectExpressions.map((item) => <p key={item.id} className="mt-3">{item.dialectText}{item.standardMeaning ? ` → ${item.standardMeaning}` : ''}</p>)}</section></div>}
    {step === 4 && <div className="grid gap-5 md:grid-cols-2"><section className="border border-brass-600/40 p-5"><h2 className="font-display text-xl">인물 관계</h2>{record.data.relationships.length ? record.data.relationships.map((item) => <article key={item.id} className="mt-3 border border-brass-600/20 p-3"><b>{item.suspect.name} · {item.relationshipType}</b><p className="text-sm opacity-70">{item.description}</p></article>) : <EmptyState label="공개된 관계 정보가 없습니다."/>}</section><section className="space-y-4"><form onSubmit={createNote} className="flex flex-col gap-3 border border-brass-600/40 p-4"><h2 className="font-display text-xl">수사 메모</h2><select name="noteType" className="bg-noir-900 p-2"><option value="FREE">자유 메모</option><option value="CONTRADICTION">모순</option><option value="DIALECT">사투리</option></select><textarea name="content" aria-label="메모 내용" required maxLength={2000} className="min-h-24 bg-noir-900 p-3"/><button disabled={saving} className="bg-evidence-red py-2">메모 저장</button></form>{record.data.notes.map((note) => <article key={note.id} className="flex justify-between border border-brass-600/30 p-4"><div><b>{note.noteType}</b><p>{note.content}</p></div><button type="button" onClick={() => remove(note.id)} className="text-evidence-red">삭제</button></article>)}</section></div>}
  </>}</div></main></AuthGuard>;
}
