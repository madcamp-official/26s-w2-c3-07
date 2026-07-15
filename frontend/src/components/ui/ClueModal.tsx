'use client';

import { useEffect, useState } from 'react';
import type { Clue } from '@/types/clue';

type Props = { clues: Clue[]; highlightedIds?: string[]; initialSelectedId?: string | null; onClose: () => void };
const sourceLabel = (source: string | null) => ({ INTERROGATION: '심문', EVIDENCE_VIEWED: '증거 열람', SESSION_REFRESH: '수사 진행' }[source ?? ''] ?? '수사 진행');

export function ClueModal({ clues, highlightedIds = [], initialSelectedId = null, onClose }: Props) {
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? clues[0]?.id ?? null);
  const selected = clues.find((clue) => clue.id === selectedId) ?? null;
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  return <div role="dialog" aria-modal="true" aria-label="획득한 단서" onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-noir-950/90 p-0 md:p-6">
    <div onClick={(event) => event.stopPropagation()} className="grid h-full w-full overflow-hidden border border-brass-600/40 bg-noir-900 md:max-h-[85vh] md:max-w-4xl md:grid-cols-[2fr_3fr]">
      <section className="overflow-y-auto border-r border-brass-600/30 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl">획득한 단서</h2><button onClick={onClose} aria-label="단서 목록 닫기">닫기</button></div>
        {!clues.length ? <p className="py-10 text-center opacity-60">아직 획득한 단서가 없습니다.</p> : <div className="space-y-2">{clues.map((clue, index) => <button key={clue.id} onClick={() => setSelectedId(clue.id)} className={`w-full border p-3 text-left ${selectedId === clue.id ? 'border-evidence-red bg-evidence-red/10' : highlightedIds.includes(clue.id) ? 'border-brass-400 bg-brass-600/10' : 'border-brass-600/30'}`}><span className="text-xs opacity-50">단서 {index + 1}</span><strong className="block">{clue.title}</strong><span className="mt-1 block text-xs opacity-60">{clue.recordSummary || clue.description}</span></button>)}</div>}
      </section>
      <section className="overflow-y-auto p-6">{selected ? <><p className="text-xs text-evidence-red">단서 상세</p><h3 className="mt-1 font-display text-3xl">{selected.title}</h3><p className="mt-4 leading-7 opacity-80">{selected.content || selected.description || '상세 설명이 없습니다.'}</p><dl className="mt-6 grid gap-3 border-t border-brass-600/30 pt-5 text-sm"><div><dt className="opacity-50">획득 여부</dt><dd>획득 완료</dd></div><div><dt className="opacity-50">획득 경로</dt><dd>{sourceLabel(selected.source)}{selected.sourceSuspect ? ` · ${selected.sourceSuspect}` : ''}</dd></div><div><dt className="opacity-50">획득 시점</dt><dd>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.unlockedAt))}</dd></div>{selected.sourceQuestion && <div><dt className="opacity-50">관련 질문</dt><dd>{selected.sourceQuestion}</dd></div>}{selected.sourceAnswer && <div><dt className="opacity-50">관련 답변</dt><dd>{selected.sourceAnswer}</dd></div>}</dl></> : <p className="grid h-full place-items-center opacity-60">확인할 단서를 선택해 주세요.</p>}</section>
    </div>
  </div>;
}
