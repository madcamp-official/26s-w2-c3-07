'use client';

import type { Difficulty } from '@/types/content';

type DifficultySelectorProps = { difficulties: Difficulty[]; selectedDifficulty: Difficulty['difficulty']; onSelectDifficulty: (difficulty: Difficulty['difficulty']) => void };
const LABEL: Record<Difficulty['difficulty'], string> = { easy: '쉬움', normal: '보통', hard: '어려움' };

export function DifficultySelector({ difficulties, selectedDifficulty, onSelectDifficulty }: DifficultySelectorProps) {
  return <div className="flex flex-wrap items-center gap-2 border border-evidence-red/50 bg-noir-900/80 px-3 py-2">{difficulties.map((item) => <button key={item.difficulty} type="button" onClick={() => onSelectDifficulty(item.difficulty)} className={`px-4 py-2 text-sm font-display transition-colors ${item.difficulty === selectedDifficulty ? 'bg-evidence-red text-parchment-100' : 'text-parchment-300/70 hover:text-parchment-100'}`}>{LABEL[item.difficulty]} · 총 {item.totalQuestions}회</button>)}</div>;
}
