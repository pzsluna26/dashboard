

import type { Metadata } from "next";
import { Geist, Geist_Mono, Black_Han_Sans, Jua } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// ✅ 한글 폰트 추가 (가변 CSS 변수로 노출)
const blackHan = Black_Han_Sans({
  weight: "400",
  subsets: ["latin", "korean"],
  variable: "--font-blackhan",
});
const jua = Jua({
  weight: "400",
  subsets: ["latin", "korean"],
  variable: "--font-jua",
});

export const metadata: Metadata = {
  title: "ISSUE & LAW",
  description: "법률과 여론을 이슈 중심으로 분석하는 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} ${blackHan.variable} ${jua.variable} antialiased`}>
        {/* ===== 배경 레이어: 위→아래 4단 그라데이션 ===== */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          {/* 메인 그라데이션 (#ced7dc → #eaebed → #f6efec → #f8e7e0) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, #ced7dc 0%, #eaebed 33%, #f6efec 66%, #f8e7e0 100%)",
            }}
          />
          {/* (옵션) 은은한 라디얼 글로우 */}
          <div className="absolute inset-0 bg-[radial-gradient(620px_320px_at_18%_15%,rgba(111,145,232,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(760px_420px_at_85%_82%,rgba(151,170,214,0.12),transparent_62%)]" />
          {/* 아주 옅은 화이트 틴트 + 미세 블러 */}
          <div className="absolute inset-0 bg-white/8 backdrop-blur-[2px]" />
        </div>

        {/* ===== 콘텐츠 래퍼 ===== */}
        <div className="w-full mx-auto flex flex-col justify-center items-center min-h-screen overflow-hidden">
          <main className="w-full h-full flex flex-col justify-center items-center overflow-y-auto flex-grow">
            {children}
          </main>
          {/* <Footer /> */}
        </div>
      </body>
    </html>
  );
}
