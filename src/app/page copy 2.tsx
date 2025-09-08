// 오른쪽 섹션 흐리게

'use client';

import Link from "next/link";

const categories = [
  { name: "개인정보보호법", href: "/private" },
  { name: "아동복지법", href: "/child" },
  { name: "중대재해처벌법", href: "/safety" },
  { name: "자본시장법", href: "/finance" },
];

export default function Home() {
  return (
    <div className="flex h-screen w-screen font-sans text-gray-800">
      {/* 왼쪽 사이드 메뉴 */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col justify-center">
        <h1 className="text-2xl font-bold mb-10 text-blue-600 text-center">법안 카테고리</h1>
        <ul className="space-y-6 text-lg font-medium">
          {categories.map((cat) => (
            <li key={cat.name}>
              <Link
                href={cat.href}
                className="hover:text-blue-600 transition-colors duration-200 block"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* 오른쪽 비디오 섹션 */}
      <main className="flex-1 relative overflow-hidden">
        <video
          src="/video/video1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        {/* 오버레이 */}
        <div className="absolute top-0 left-0 w-full h-full bg-white/40 backdrop-blur-sm" />

        {/* 센터 텍스트 */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">정책 분석 플랫폼</h2>
            <p className="text-lg text-gray-600">사회적 이슈에 대한 여론과 뉴스를 시각적으로 확인하세요.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
