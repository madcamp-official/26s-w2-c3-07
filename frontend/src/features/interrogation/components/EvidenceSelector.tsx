'use client';

import type { Evidence } from '@/types/clue';

type EvidenceSelectorProps = {
  evidence: Evidence[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  maxSelected?: number;
};

export function EvidenceSelector({ evidence, selectedIds, onChange, disabled = false, maxSelected = 3 }: EvidenceSelectorProps) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((selected) => selected !== id));
    else if (selectedIds.length < maxSelected) onChange([...selectedIds, id]);
  };

  return (
    <section aria-label="제시할 증거" className="border border-brass-600/30 bg-noir-900/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm text-brass-300">증거 제시 (선택)</h2>
        <span className="text-xs text-parchment-300/60">{selectedIds.length}/{maxSelected}</span>
      </div>
      {evidence.length === 0 ? (
        <p className="text-xs text-parchment-300/60">현재 제시할 수 있는 증거가 없습니다.</p>
      ) : (
        <div className="flex max-h-40 gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-y-auto">
          {evidence.map((item) => {
            const selected = selectedIds.includes(item.id);
            const blocked = disabled || (!selected && selectedIds.length >= maxSelected);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                disabled={blocked}
                onClick={() => toggle(item.id)}
                className={`min-w-52 border p-3 text-left transition sm:min-w-0 ${selected ? 'border-evidence-red bg-evidence-red/15' : 'border-brass-600/20 bg-noir-950/60'} disabled:opacity-40`}
              >
                <strong className="block text-sm text-parchment-100">{item.title}</strong>
                <span className="mt-1 line-clamp-2 block text-xs text-parchment-300/65">{item.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
