'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBgm } from '@/features/settings/useBgm';
function ImageButton({ href, image, label }: { href: string; image: string; label: string }) {
  return (
    <Link href={href} className="relative block h-14 w-full">
      <Image src={image} alt="" fill sizes="576px" className="pointer-events-none object-fill" />
      <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold drop-shadow">{label}</span>
    </Link>
  );
}
export default function HomePage(){const auth=useAuth();const router=useRouter();useBgm('home');async function logout(){await auth.signOut();router.replace('/login')}return <main className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-noir-950 px-6 pb-64 text-parchment-100"><Image src="/images/ui/home.png" alt="탐정님, 그 뜻이 아니예라" fill priority sizes="100vw" className="pointer-events-none object-cover object-top" /><div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-noir-950/40 to-noir-950" /><div className="relative mx-auto w-full max-w-xl space-y-3 text-center"><nav className="grid gap-2"><ImageButton image="/images/ui/button1.png" label="사건 수사 시작" href={auth.profile?'/regions':'/login'} /><ImageButton image="/images/ui/button2.png" label="수사 기록 보기" href={auth.profile?'/profile/history':'/login'} /><ImageButton image="/images/ui/button3.png" label="사투리 기록집" href={auth.profile?'/profile/dialects':'/login'} /></nav>{auth.profile&&<button onClick={logout} className="text-sm opacity-60">로그아웃</button>}</div></main>}
