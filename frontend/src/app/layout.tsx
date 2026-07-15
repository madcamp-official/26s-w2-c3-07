import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AudioManager } from '@/features/settings/AudioManager';

export const metadata: Metadata = {
  title: "그 뜻이 아니예라 | 사투리 심문",
  description: "사투리 속 진실을 파헤치는 심문 추리 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-body antialiased"><AudioManager><AuthProvider>{children}</AuthProvider></AudioManager></body>
    </html>
  );
}
