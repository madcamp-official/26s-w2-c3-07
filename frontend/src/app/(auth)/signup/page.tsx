import Image from "next/image";
import Link from "next/link";
import { SignupPanel } from "@/components/auth/SignupPanel";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-noir-950">
      <Image
        src="/images/ui/login.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover"
      />

      <div className="relative flex flex-1 flex-col justify-between gap-8 px-6 py-10 md:px-16 md:py-12">
        {/* 중앙: 종이 메모 위 등록 폼 */}
        <div className="flex flex-1 items-center justify-center">
          <SignupPanel />
        </div>

        {/* 하단 영역 */}
        <div className="flex items-center justify-between text-sm text-parchment-300/70">
          <div className="flex items-center gap-6">
            <Link href="/settings" className="transition-colors hover:text-parchment-100">
              ⚙ 설정
            </Link>
          </div>
          <p className="text-xs text-parchment-300/40">v1.0.0</p>
        </div>
      </div>
    </main>
  );
}
