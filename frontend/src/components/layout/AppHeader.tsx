import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthProvider';

export function AppHeader() {
  const { profile } = useAuth();
  return (
    <div className="block">
      <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-bold text-parchment-100 transition-opacity hover:opacity-80">
        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-noir-950">
          <Image src="/images/ui/logo.png" alt="" fill sizes="28px" className="object-cover" />
        </span>
        {profile?.displayName ? `${profile.displayName}님, ` : ''}그 뜻이 아니예라
      </Link>
    </div>
  );
}
