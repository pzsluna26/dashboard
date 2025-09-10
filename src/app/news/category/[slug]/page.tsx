'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LawOpinionPie from '@/components/LawOpinionPie';
import KeywordCloud from '@/components/KeywordCloud';
import KeywordTrendChart from '@/components/graphCard';

// 필요한 타입 정의 (추후 필요 시 확장 가능)
type NewsData = any;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    const formatted = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
    setSelectedDate(formatted);
  };

  // slug → 한글 이름 매핑
  const displayNameMap: Record<string, string> = {
    privacy: '개인정보보호법',
    finance: '자본시장법 외',
    child: '아동복지법',
    safety: '중대재해처벌법',
  };
  const displayName = slug ? displayNameMap[slug] ?? slug : '';

  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    fetch(`http://10.125.121.217:8080/api/news/category/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        console.log('스프링에서 받아온 뉴스 데이터:', json);

        const lawData = json[slug]; // 
        console.log('👉 이 법률에 해당하는 데이터:', lawData);

        if (!lawData) {
          setData(null);
        } else {
          setData(lawData);
        }

        const dummyDate = '2025-01-01';
        setSelectedDate(dummyDate);
      })
      .catch((err) => {
        console.error('데이터 로딩 실패:', err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="p-4">로딩 중...</p>;
  if (!data) return <p className="p-4 text-red-500">데이터 없음</p>;

  const dateOptions = ['20250101', '20250201']; // 나중에 data.news에서 자동 추출 가능

  // 여기서 keyword_trend 객체에서 키워드 배열 생성
  const keywordTrendData = data?.incident_groups?.['중분류1']?.['소분류1(사건)']?.keyword_trend;
  const keywords = keywordTrendData ? Object.keys(keywordTrendData) : [];

  return (
    <div className="bg-gray-50 rounded-xl w-full min-h-screen flex flex-col items-center">
      <div className="rounded-xl border border-gray-200 shadow-sm mt-10 w-full max-w-5xl">
        {slug && <KeywordTrendChart slug={slug} />}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-5xl max-h-[400px]">
        <div className="w-full md:basis-2/5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">여론</h2>
            <span className="text-sm mb-4 text-gray-800">
              찬성 {data.social?.찬성 ?? 0}% 반대 {data.social?.반대 ?? 0}% 중립 {data.social?.중립 ?? 0}%
            </span>
          </div>
          <LawOpinionPie social={data.social} />
        </div>

        <div className="w-full md:basis-3/5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex w-full justify-between items-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">핫이슈</h2>
            <select value={selectedDate.replace(/-/g, '')} onChange={handleDateChange}>
              {dateOptions.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
          <KeywordCloud keywords={keywords} selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
}
