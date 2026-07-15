'use client';

import Image from 'next/image';
import { useEffect } from 'react';

type EvidenceModalProps = {
  title: string;
  description: string | null;
  image: string | null;
  discoveredAt?: string | null;
  viewedAt?: string | null;
  source?: string | null;
  loading?: boolean;
  onClose: () => void;
};

const SOURCE_LABELS: Record<string, string> = { INITIAL: '초기 수사 자료', CLUE_UNLOCK: '단서 획득', INTERROGATION: '심문' };
const dateLabel = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '확인되지 않음';

export function EvidenceModal({ title, description, image, discoveredAt, viewedAt, source, loading = false, onClose }: EvidenceModalProps) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={`${title} 증거 상세`} className="fixed inset-0 z-50 grid place-items-center bg-noir-950/90 p-0 md:p-6" onClick={onClose}>
      <div
        className="h-full w-full overflow-y-auto border border-brass-600/40 bg-noir-900 md:max-h-[90vh] md:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {image ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-noir-950">
            <Image src={image} alt={title} fill sizes="512px" className="object-contain" />
          </div>
        ) : <div className="grid aspect-[4/3] w-full place-items-center bg-noir-950 text-sm opacity-60">증거 이미지가 없습니다.</div>}
        <div className="p-5">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          {loading ? <p className="mt-3 text-sm opacity-70">증거 정보를 불러오는 중...</p> : <>
            <p className="mt-2 text-sm opacity-70">{description || '상세 설명이 없습니다.'}</p>
            <dl className="mt-5 grid gap-2 border-t border-brass-600/30 pt-4 text-sm">
              <div className="flex justify-between gap-4"><dt>획득 여부</dt><dd>획득 완료</dd></div>
              <div className="flex justify-between gap-4"><dt>획득 시점</dt><dd>{dateLabel(discoveredAt)}</dd></div>
              <div className="flex justify-between gap-4"><dt>획득 경로</dt><dd>{source ? SOURCE_LABELS[source] ?? '수사 진행' : '확인되지 않음'}</dd></div>
              <div className="flex justify-between gap-4"><dt>열람 상태</dt><dd>{viewedAt ? `열람 완료 (${dateLabel(viewedAt)})` : '처음 열람'}</dd></div>
            </dl>
          </>}
          <button onClick={onClose} className="mt-5 w-full border border-brass-600/40 py-2 text-sm">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
