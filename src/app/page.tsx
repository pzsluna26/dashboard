'use client';

import Link from 'next/link';

const categories = [
  { name: '개인정보보호법', href: '/private' },
  { name: '아동복지법', href: '/child' },
  { name: '중대재해처벌법', href: '/safety' },
  { name: '자본시장법', href: '/finance' },
];

// 예시용 인기 토픽
const popularTopics = [
  '디지털 정보',
  '청소년 보호',
  '노동자 안전',
  '금융 투자',
  '데이터 유출',
  '산재 사고',
  '미성년자 범죄',
  'SNS 여론',
  '법 개정',
  '플랫폼 규제',
];

export default function Home() {
  return (
    <div className="flex h-screen w-screen font-sans text-gray-800">
      {/* 왼쪽 사이드 메뉴 */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col justify-center">
        {/* <h1 className="text-2xl font-bold mb-10 text-blue-600 text-center">
          
        </h1> */}
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

      {/* 오른쪽 비디오 배경 영역 */}
      <main className="flex-1 relative overflow-hidden">
        {/* 배경 비디오 */}
        <video
          src="/video/video1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        />

        {/* 흐림 오버레이 */}
        {/* <div className="absolute top-0 left-0 w-full h-full bg-white/20 backdrop-blur-sm" /> */}
        <div className="absolute top-0 left-0 w-full h-full" />

        {/* 중앙 텍스트 */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
           
            </h2>
            <p className="text-lg text-gray-600">
              사회적 이슈에 대한 여론과 뉴스를 시각적으로 확인하세요.
            </p>
          </div>
        </div>

        {/* 우측 하단 인기 토픽 박스 */}
        <div className="absolute bottom-20 right-6 z-10">
          <div className="bg-white/60 backdrop-blur-sx shadow-md rounded-lg p-4 w-64">
            <h3 className="text-lg font-semibold mb-3 text-black">🔥 핫토픽 TOP 10</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              {popularTopics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
