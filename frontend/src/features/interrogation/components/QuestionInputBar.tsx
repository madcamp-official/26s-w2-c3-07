'use client';

import { useState } from 'react';
import { TabbedPanel } from '@/features/interrogation/components/TabbedPanel';

type QuestionInputBarProps = { onSubmit: (question: string) => void; disabled?: boolean };

export function QuestionInputBar({ onSubmit, disabled = false }: QuestionInputBarProps) {
  const [value, setValue] = useState('');
  function handleSubmit() { const trimmed = value.trim(); if (!trimmed || disabled) return; onSubmit(trimmed); setValue(''); }
  return <TabbedPanel label="질문 입력"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><input aria-label="질문" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSubmit(); }} disabled={disabled} maxLength={500} placeholder="질문을 입력하세요..." className="flex-1 border border-brass-600/30 bg-noir-950/70 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-300/40 focus:border-brass-400 focus:outline-none disabled:opacity-50"/><button type="button" onClick={handleSubmit} disabled={disabled || value.trim().length < 2} className="shrink-0 bg-evidence-red px-8 py-3 font-display text-base font-bold text-parchment-100 disabled:opacity-40">질문하기</button></div></TabbedPanel>;
}
