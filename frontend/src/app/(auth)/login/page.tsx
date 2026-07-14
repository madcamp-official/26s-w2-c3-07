import { CaseFileTeaser } from "@/components/auth/CaseFileTeaser";
import { CaseSummaryCard } from "@/components/auth/CaseSummaryCard";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { MagnifierBadge } from "@/components/auth/MagnifierBadge";
import { StickyNote } from "@/components/home/StickyNote";
import { AlleyBackground } from "@/components/layout/AlleyBackground";
import { BrandMark } from "@/components/layout/BrandMark";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-noir-950">
      <AlleyBackground />

      <div className="relative flex flex-1 flex-col justify-between gap-8 px-6 py-10 md:px-16 md:py-12">
        {/* 상단 영역 */}
        <div className="flex items-start justify-between gap-6">
          <BrandMark showIcon />
          <CaseFileTeaser />
        </div>

        {/* 중앙: 사건 개요 + 로그인 폼 + 돋보기 */}
        <div className="flex flex-1 items-center justify-center gap-10">
          <div className="hidden shrink-0 flex-col gap-6 lg:flex">
            <CaseSummaryCard />
            <StickyNote
              lines={["용의자들의 사투리를", "주의 깊게 들어라", "", "그 안에 진실이 있다!"]}
              variant="yellow"
              className="w-64"
            />
          </div>

          <LoginPanel />

          <div className="hidden shrink-0 lg:block">
            <MagnifierBadge />
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="flex items-center justify-between text-sm text-parchment-300/70">
          <div className="flex items-center gap-6">
            <button type="button" className="transition-colors hover:text-parchment-100">
              ⚙ 설정
            </button>
          </div>
          <p className="text-xs text-parchment-300/40">v1.0.0</p>
        </div>
      </div>
    </main>
  );
}
