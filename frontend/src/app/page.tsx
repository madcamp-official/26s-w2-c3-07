'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlleyBackground } from '@/components/layout/AlleyBackground';
import { BrandMark } from '@/components/layout/BrandMark';
import { useAuth } from '@/features/auth/AuthProvider';
export default function HomePage(){const auth=useAuth();const router=useRouter();async function logout(){await auth.signOut();router.replace('/login')}return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-noir-950 px-6 text-parchment-100"><AlleyBackground/><div className="relative w-full max-w-xl space-y-8 text-center"><BrandMark showIcon/><div><p className="font-display text-2xl">{auth.profile?`${auth.profile.displayName??'탐정'}님,`:'사투리 속 진실을 찾아라'}</p><h1 className="mt-2 font-display text-5xl font-bold">그 뜻이 아니예라</h1><p className="mt-4 text-brass-400">사투리 속 진실을 파헤치는 심문 추리 게임</p></div><nav className="grid gap-3"><Link className="bg-evidence-red py-4 font-bold" href={auth.profile?'/regions':'/login'}>사건 수사 시작</Link><Link className="border border-brass-600/40 py-4" href={auth.profile?'/profile/history':'/login'}>수사 기록 보기</Link><Link className="border border-brass-600/40 py-4" href={auth.profile?'/profile/dialects':'/login'}>사투리 기록집</Link></nav>{auth.profile&&<button onClick={logout} className="text-sm opacity-60">로그아웃</button>}</div></main>}
