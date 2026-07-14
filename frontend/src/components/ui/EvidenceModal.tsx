'use client';

import Image from 'next/image';

type EvidenceModalProps = {
  title: string;
  description: string;
  image: string | null;
  onClose: () => void;
};

export function EvidenceModal({ title, description, image, onClose }: EvidenceModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-noir-950/80 p-6" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-brass-600/40 bg-noir-900"
        onClick={(event) => event.stopPropagation()}
      >
        {image && (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-noir-950">
            <Image src={image} alt={title} fill sizes="512px" className="object-contain" />
          </div>
        )}
        <div className="p-5">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm opacity-70">{description}</p>
          <button onClick={onClose} className="mt-5 w-full border border-brass-600/40 py-2 text-sm">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
