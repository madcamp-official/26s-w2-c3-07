import type { PublicSuspect } from '@/types/content';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';

type SuspectPortraitProps = {
  suspect: Pick<PublicSuspect, 'imageUrl' | 'name'>;
};

export function SuspectPortrait({ suspect }: SuspectPortraitProps) {
  return (
    <SuspectImage
      imageUrl={suspect.imageUrl}
      name={suspect.name}
      priority
      sizes="(min-width: 768px) 448px, 100vw"
      className="mx-auto h-72 w-full max-w-md md:h-80"
    />
  );
}
