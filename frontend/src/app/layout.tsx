import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
