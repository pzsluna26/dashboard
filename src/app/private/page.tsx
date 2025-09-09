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
  const [selectedDate, setSelectedDate] = useState('20250101'); // YYYYMMDD 포맷 유지

  // 날짜 옵션 (내림차순 정렬, YYYYMMDD 그대로 유지)
  let dateOptions: string[] = [];
  if (data && data['개인정보보호법'] && data['개인정보보호법'].news) {
    dateOptions = Object.keys(data['개인정보보호법'].news).sort((a, b) => (b > a ? 1 : -1));
  }

  // YYYYMMDD → YYYY-MM-DD 변환 함수
  const formatToInputDate = (yyyymmdd: string) =>
    `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

  // YYYY-MM-DD → YYYYMMDD 변환 함수
  const formatToDataDate = (yyyymmddDash: string) =>
    yyyymmddDash.replace(/-/g, '');

  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);

        if (json && json['개인정보보호법'] && json['개인정보보호법'].news) {
          const dates = Object.keys(json['개인정보보호법'].news);
          if (dates.length > 0) {
            const sortedDates = dates.sort((a, b) => (b > a ? 1 : -1));
            setSelectedDate(sortedDates[0]);
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

  return (
    <div className="bg-gray-50 rounded-xl w-[1000px] min-h-screen flex flex-col items-center p-10 ">
      {/* 그래프 카드 */}
      <div className="w-full max-w-5xl ">
        <h1 className='text-xl font-semibold mb-4 w-full text-gray-700 text-center mb-10'>개인정보보호법</h1>
        <GraphCard
          title="개인정보보호법"
          data={lawData.news}
          color={['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-5xl max-h-[400px]">
        {/* 여론 카드 */}
        <div className="w-full md:basis-2/5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm items-center">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">여론</h2>
            <span className="text-sm mb-4 text-gray-800">찬성 30% 50% 중립 20%</span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <LawOpinionPie lawName="개인정보보호법" />
          </div>
        </div>

        {/* 워드클라우드 카드 */}
        <div className="w-full md:basis-3/5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex w-full justify-between items-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 leading-none">핫이슈</h2>
            <input
              type="date"
              value={formatToInputDate(selectedDate)} // YYYY-MM-DD 포맷으로 변환해서 넣기
              onChange={(e) => setSelectedDate(formatToDataDate(e.target.value))} // 다시 YYYYMMDD로 변환해 상태 저장
              min={dateOptions.length > 0 ? formatToInputDate(dateOptions[dateOptions.length - 1]) : undefined}
              max={dateOptions.length > 0 ? formatToInputDate(dateOptions[0]) : undefined}
              className="rounded px-2 py-1 text-gray-700 leading-none mb-4"
              style={{ height: '32px' }}
            />
          </div>

          <div>
            <KeywordCloud
              keywords={[
                "법정", "참사", "유가족", "개인정보", "개정", "이동권", "개인정보", "보호", "유출", "해킹", "암호화", "동의",
                "이용자", "보안", "법률", "정책", "데이터", "접근권", "투명성", "책임", "감독", "벌칙",
                "인증", "로그", "추적", "권한", "사이버", "위험", "신고", "감사", "통제", "처리"
              ]}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
