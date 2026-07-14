'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { InvestigationRecord, Note } from '@/types/record';
import { ApiError } from '@/types/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { EvidenceModal } from '@/components/ui/EvidenceModal';
import { resolveEvidenceImage } from '@/features/episode/utils/evidenceImage';

type Tab = 'overview' | 'testimonies' | 'timeline' | 'notes';
export default function RecordsPage() {
  const { sessionId } = useParams<{ sessionId: string }>(); const record = useApiResource<InvestigationRecord>(`/sessions/${sessionId}/records`);
  const [tab, setTab] = useState<Tab>('overview'); const [error, setError] = useState<ApiError | null>(null); const [saving, setSaving] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<InvestigationRecord['evidence'][number] | null>(null);
  async function createNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (saving) return; const data = new FormData(event.currentTarget); setSaving(true); setError(null); try { await api.post<Note>(`/sessions/${sessionId}/notes`, { noteType: data.get('noteType'), content: data.get('content'), suspectId: null, relatedRef: {} }); event.currentTarget.reset(); await record.reload(); } catch (cause) { setError(cause as ApiError); } finally { setSaving(false); } }
  async function remove(noteId: string) { try { await api.delete(`/sessions/${sessionId}/notes/${noteId}`); await record.reload(); } catch (cause) { setError(cause as ApiError); } }
  const tabs: Array<[Tab,string]> = [['overview','전체 기록'],['testimonies','증언'],['timeline','타임라인'],['notes','메모']];
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-6"><AppHeader /><header className="flex justify-between"><div><p className="text-xs text-evidence-red">INVESTIGATION RECORD</p><h1 className="font-display text-4xl">사건 기록</h1></div><Link href={`/game/${sessionId}`}>게임으로 →</Link></header>
    <nav className="flex flex-wrap gap-2">{tabs.map(([id,label]) => <button key={id} onClick={() => setTab(id)} className={`border px-4 py-2 ${tab === id ? 'bg-evidence-red' : 'border-brass-600/30'}`}>{label}</button>)}</nav>
    {error && <ErrorState error={error} />}{record.loading ? <LoadingState /> : record.error ? <ErrorState error={record.error} retry={record.reload} /> : record.data && <>
      {tab === 'overview' && <div className="grid gap-5 md:grid-cols-2"><section className="border p-5"><h2 className="font-display text-2xl">{record.data.caseOverview.title}</h2><p className="mt-2 text-sm opacity-70">{record.data.caseOverview.synopsis}</p></section><section className="border p-5"><h2 className="font-bold text-brass-400">확인한 증거</h2>{record.data.evidence.map((item) => <button key={item.id} onClick={() => setPreviewEvidence(item)} className="mt-2 block text-left underline decoration-dotted">• {item.title}</button>)}</section><section className="border p-5"><h2 className="font-bold text-brass-400">증언</h2>{!record.data.testimonies.length ? <p className="mt-2 text-sm opacity-60">저장된 증언이 없습니다.</p> : record.data.testimonies.map((item) => <p key={item.id} className="mt-2">• {item.suspectName}: {item.response}</p>)}</section><section className="border p-5"><h2 className="font-bold text-brass-400">메모</h2>{!record.data.notes.length ? <p className="mt-2 text-sm opacity-60">작성된 메모가 없습니다.</p> : record.data.notes.map((note) => <p key={note.id} className="mt-2">• {note.content}</p>)}</section></div>}
      {tab === 'testimonies' && (!record.data.testimonies.length ? <EmptyState label="저장된 증언이 없습니다." /> : <div className="space-y-3">{record.data.testimonies.map((item) => <article key={item.id} className="border border-brass-600/30 p-4"><b>{item.suspectName}</b><p className="mt-2 text-sm">Q. {item.question}</p><p className="mt-1">A. {item.response}</p></article>)}</div>)}
      {tab === 'timeline' && (!record.data.timeline.length ? <EmptyState label="공개되거나 해금된 타임라인이 없습니다." /> : <ol className="space-y-3">{record.data.timeline.map((item) => <li key={item.id} className="border-l-2 border-brass-400 pl-4"><b>{item.occurredAt} · {item.title}</b><p className="text-sm opacity-70">{item.description}</p></li>)}</ol>)}
      {tab === 'notes' && <section className="space-y-4"><form onSubmit={createNote} className="flex flex-col gap-3 border p-4"><select name="noteType" className="bg-noir-900 p-2"><option value="FREE">자유 메모</option><option value="CONTRADICTION">모순</option><option value="DIALECT">사투리</option></select><textarea name="content" required maxLength={2000} className="min-h-24 bg-noir-900 p-3"/><button disabled={saving} className="bg-evidence-red py-2">메모 저장</button></form>{record.data.notes.map((note) => <article key={note.id} className="flex justify-between border p-4"><div><b>{note.noteType}</b><p>{note.content}</p></div><button onClick={() => remove(note.id)} className="text-evidence-red">삭제</button></article>)}</section>}
    </>}
    {previewEvidence && <EvidenceModal title={previewEvidence.title} description={previewEvidence.description} image={resolveEvidenceImage(previewEvidence.code)} onClose={() => setPreviewEvidence(null)} />}
  </div></main></AuthGuard>;
}
