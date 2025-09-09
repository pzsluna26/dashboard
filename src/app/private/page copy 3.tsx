'use client';

import React, { useEffect, useState } from 'react';
import GraphCard from '@/components/graphCard';
import LawOpinionPie from '@/components/LawOpinionPie';
import KeywordCloud from '@/components/KeywordCloud';

interface Article {
  title: string;
  content: string;
}

interface NewsDayData {
  count: number;
  articles: Article[];
}

interface NewsData {
  [date: string]: NewsDayData;
}

interface SocialData {
  blog: number;
  community: number;
  twitter: number;
  insta: number;
}

interface LawCategoryData {
  news: NewsData;
  social: SocialData;
}

interface LawData {
  [category: string]: LawCategoryData;
}

export default function Private() {
  const [data, setData] = useState<LawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  // 날짜변경 핸들러
  const handleDateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    const formatted = val.slice(0, 4) + '-' + val.slice(4, 6) + '-' + val.slice(6, 8);
    setSelectedDate(formatted);
  };

  useEffect(() => {
    fetch('/law_data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);

        // 초기 selectedDate를 데이터 내 최신 날짜로 설정 (있으면)
        if (json && json['개인정보보호법'] && json['개인정보보호법'].news) {
          const dates = Object.keys(json['개인정보보호법'].news);
          if (dates.length > 0) {
            // 내림차순 정렬해서 최신 날짜 선택
            const latestDate = dates.sort((a, b) => b.localeCompare(a))[0];
            const formatted = latestDate.slice(0, 4) + '-' + latestDate.slice(4, 6) + '-' + latestDate.slice(6, 8);
            setSelectedDate(formatted);
          }
        }
      })
      .catch((err) => {
        console.error('데이터 로딩 실패:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">로딩 중...</p>;
  if (!data || !data['개인정보보호법'])
    return <p className="p-4 text-red-500">데이터를 불러오지 못했습니다.</p>;

  const lawData = data['개인정보보호법'];

  // news에 있는 날짜 키를 가져와서 select 옵션 생성
  const dateOptions = Object.keys(lawData.news).sort((a, b) => b.localeCompare(a)); // 최신순

  return (
    <div className="bg-gray-50 rounded-xl w-full min-h-screen flex flex-col items-center">
      {/* 그래프 카드 */}
      <div className="rounded-xl border border-gray-200 shadow-sm mt-10 w-full max-w-5xl">
        <GraphCard
          title="개인정보보호법"
          data={lawData.news}
          color={['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-5xl max-h-[400px]">
        {/* 여론 카드 */}
        <div className="w-full md:basis-2/5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">여론</h2>
            <span className="text-sm mb-4 text-gray-800">찬성 30% 반대 50% 중립 20%</span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {/* 원형 그래프 */}
            <LawOpinionPie lawName="개인정보보호법" />
          </div>
        </div>

        {/* 피크뉴스 카드 */}
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
          <div>
            <KeywordCloud
              keywords={['가이드라인', '마이데이터', '개정', '이동권', '해킹', '유출', '중단', '위약금', '과징금']}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
