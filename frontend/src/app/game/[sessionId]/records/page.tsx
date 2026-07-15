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
import { noteTypeLabel } from '@/lib/game-labels';
import { useResolvedSessionRoute } from '@/features/session/useResolvedSessionRoute';

type Tab = 'overview' | 'testimonies' | 'timeline' | 'notes';
type NoteType = Note['noteType'];

export default function RecordsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const route = useResolvedSessionRoute(sessionId);
  const actualSessionId = route.data?.sessionId;
  const record = useApiResource<InvestigationRecord>(actualSessionId ? `/sessions/${actualSessionId}/records` : null);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteType, setNoteType] = useState<NoteType>('FREE');
  const [content, setContent] = useState('');
  const [previewEvidence, setPreviewEvidence] = useState<InvestigationRecord['evidence'][number] | null>(null);

  function updateNoteState(saved: Note) {
    record.setData((current) => current ? {
      ...current,
      notes: [saved, ...current.notes.filter((note) => note.id !== saved.id)]
    } : current);
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !actualSessionId || !content.trim()) return;
    const form = event.currentTarget;
    const payload = { noteType, content: content.trim(), suspectId: null, relatedRef: {} };
    setSaving(true); setError(null); setNotice('');
    try {
      const saved = editingId
        ? await api.patch<Note>(`/sessions/${actualSessionId}/notes/${editingId}`, payload)
        : await api.post<Note>(`/sessions/${actualSessionId}/notes`, payload);
      if (!saved?.id) throw new ApiError(500, 'NOTE_RESPONSE_INVALID', 'Saved note was not returned', 'server');
      updateNoteState(saved);
      setContent(''); setNoteType('FREE'); setEditingId(null);
      form.reset();
      setNotice('메모가 저장되었습니다.');
    } catch (cause) {
      console.error('메모 저장 실패', cause);
      setError(cause as ApiError);
    } finally {
      setSaving(false);
    }
  }

  function edit(note: Note) {
    setEditingId(note.id); setNoteType(note.noteType); setContent(note.content); setTab('notes'); setNotice(''); setError(null);
  }

  async function remove(noteId: string) {
    if (saving || !actualSessionId) return;
    try {
      await api.delete(`/sessions/${actualSessionId}/notes/${noteId}`);
      record.setData((current) => current ? { ...current, notes: current.notes.filter((note) => note.id !== noteId) } : current);
    } catch (cause) {
      console.error('메모 삭제 실패', cause);
      setError(cause as ApiError);
    }
  }

  const tabs: Array<[Tab, string]> = [['overview', '전체 기록'], ['testimonies', '증언'], ['timeline', '타임라인'], ['notes', '메모']];
  if (route.loading) return <LoadingState label="게임 주소를 확인하는 중..." />;
  if (route.error) return <ErrorState error={route.error} retry={route.reload} message="게임 세션을 찾을 수 없습니다." />;
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-6">
    <AppHeader />
    <header className="flex justify-between"><div><p className="text-xs text-evidence-red">사건 기록</p><h1 className="font-display text-4xl">사건 기록</h1></div><Link href={`/game/${route.data?.episodeCode ?? sessionId}`}>게임으로 →</Link></header>
    <nav className="flex flex-wrap gap-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`border px-4 py-2 ${tab === id ? 'bg-evidence-red' : 'border-brass-600/30'}`}>{label}</button>)}</nav>
    {notice && <p role="status" className="border border-brass-400 bg-brass-600/10 p-3">{notice}</p>}
    {error && <ErrorState error={error} message="메모를 저장하지 못했습니다. 다시 시도해 주세요." />}
    {record.loading ? <LoadingState /> : record.error ? <ErrorState error={record.error} retry={record.reload} message="사건 기록을 불러오지 못했습니다." /> : record.data && <>
      {tab === 'overview' && <div className="grid gap-5 md:grid-cols-2">
        <section className="border p-5"><h2 className="font-display text-2xl">{record.data.caseOverview.title}</h2><p className="mt-2 text-sm opacity-70">{record.data.caseOverview.synopsis}</p></section>
        <section className="border p-5"><h2 className="font-bold text-brass-400">확인한 증거</h2>{record.data.evidence.map((item) => <button key={item.id} onClick={() => setPreviewEvidence(item)} className="mt-2 block text-left underline decoration-dotted">• {item.title}</button>)}</section>
        <section className="border p-5"><h2 className="font-bold text-brass-400">증언</h2>{!record.data.testimonies.length ? <p className="mt-2 text-sm opacity-60">저장된 증언이 없습니다.</p> : record.data.testimonies.map((item) => <p key={item.id} className="mt-2">• {item.suspectName}: {item.response}</p>)}</section>
        <section className="border p-5"><h2 className="font-bold text-brass-400">메모</h2>{!record.data.notes.length ? <p className="mt-2 text-sm opacity-60">작성된 메모가 없습니다.</p> : record.data.notes.map((note) => <button key={note.id} onClick={() => edit(note)} className="mt-2 block text-left">• {note.content}</button>)}</section>
      </div>}
      {tab === 'testimonies' && (!record.data.testimonies.length ? <EmptyState label="저장된 증언이 없습니다." /> : <div className="space-y-3">{record.data.testimonies.map((item) => <article key={item.id} className="border border-brass-600/30 p-4"><b>{item.suspectName}</b><p className="mt-2 text-sm">Q. {item.question}</p><p className="mt-1">A. {item.response}</p></article>)}</div>)}
      {tab === 'timeline' && (!record.data.timeline.length ? <EmptyState label="공개되거나 해금된 타임라인이 없습니다." /> : <ol className="space-y-3">{record.data.timeline.map((item) => <li key={item.id} className="border-l-2 border-brass-400 pl-4"><b>{item.occurredAt} · {item.title}</b><p className="text-sm opacity-70">{item.description}</p></li>)}</ol>)}
      {tab === 'notes' && <section className="space-y-4">
        <form onSubmit={saveNote} className="flex flex-col gap-3 border p-4">
          <select aria-label="메모 유형" value={noteType} onChange={(event) => setNoteType(event.target.value as NoteType)} disabled={saving} className="bg-noir-900 p-2"><option value="FREE">자유 메모</option><option value="CONTRADICTION">모순</option><option value="DIALECT">사투리</option></select>
          <textarea aria-label="메모 내용" value={content} onChange={(event) => setContent(event.target.value)} required maxLength={2000} disabled={saving} className="min-h-24 bg-noir-900 p-3" />
          <button disabled={saving || !content.trim()} className="bg-evidence-red py-2 disabled:opacity-50">{saving ? '저장 중...' : editingId ? '메모 수정' : '메모 저장'}</button>
          {editingId && <button type="button" disabled={saving} onClick={() => { setEditingId(null); setContent(''); setNoteType('FREE'); }} className="border border-brass-600/30 py-2">수정 취소</button>}
        </form>
        {record.data.notes.map((note) => <article key={note.id} className="flex justify-between gap-4 border p-4"><div><b>{noteTypeLabel(note.noteType)}</b><p>{note.content}</p></div><div className="flex gap-3"><button onClick={() => edit(note)} className="text-brass-400">수정</button><button onClick={() => void remove(note.id)} className="text-evidence-red">삭제</button></div></article>)}
      </section>}
    </>}
    {previewEvidence && <EvidenceModal title={previewEvidence.title} description={previewEvidence.description} image={resolveEvidenceImage(previewEvidence.code)} viewedAt={previewEvidence.viewedAt} onClose={() => setPreviewEvidence(null)} />}
  </div></main></AuthGuard>;
}
