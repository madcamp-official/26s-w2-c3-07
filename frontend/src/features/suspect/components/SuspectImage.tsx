import Image from 'next/image';
import type { PublicSuspect } from '@/types/content';

type SuspectImageProps = Pick<PublicSuspect, 'imageUrl' | 'name'> & {
  className?: string;
  priority?: boolean;
  sizes: string;
};

export function SuspectImage({ className = '', imageUrl, name, priority = false, sizes }: SuspectImageProps) {
  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#3a322a_0%,#1a1510_55%,#0a0806_100%)] ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${name} 용의자 초상화`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center font-display text-5xl text-parchment-100/40" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
      )}
    </div>
  );
}
