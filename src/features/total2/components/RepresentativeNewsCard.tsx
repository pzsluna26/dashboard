"use client";

import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import RepresentativeNewsCard from "./RepresentativeNewsCard"; // ✅ 따로 만든 카드 불러오기
import { PeriodKey, PeriodLabel } from "@/shared/types/common";

interface TrendingKeywordTickerProps {
  keywords: string[];
  newsData: any;
  period: PeriodKey;
  setPeriod: (period: PeriodKey) => void;
}

export default function TrendingKeywordTicker({
  keywords,
  newsData,
  period,
  setPeriod,
}: TrendingKeywordTickerProps) {
  const [index, setIndex] = useState(0);

  const periodLabels: Record<PeriodKey, PeriodLabel> = {
    daily_timeline: "일",
    weekly_timeline: "주",
    monthly_timeline: "월",
  };

  // ✅ 키워드 자동 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % keywords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [keywords]);

  const currentKeyword = keywords[index];

  // ✅ 기간 변경 핸들러
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as PeriodKey;
    setPeriod(selected);
    console.log("🟢 선택된 기간:", selected);
  };

  // ✅ news 데이터 탐색 로직
  const root = newsData || {};
  let foundCategory: string | null = null;
  let representativeArticle: string | null = null;
  let articleObj: any = null;
  let articleDate: string | null = null;

  for (const categoryKey of Object.keys(root)) {
    const news = root[categoryKey]?.news?.[period];
    if (!news) continue;

    // 날짜 단위 순회
    for (const dateKey in news) {
      const midCategories = news[dateKey]?.["중분류목록"] || {};
      for (const midKey in midCategories) {
        const subCategories = midCategories[midKey]?.["소분류목록"] || {};
        if (subCategories[currentKeyword]) {
          representativeArticle = subCategories[currentKeyword]["대표뉴스"];
          articleObj = subCategories[currentKeyword]["articles"]?.[0];
          articleDate = dateKey;
          foundCategory = categoryKey;
          break;
        }
      }
      if (representativeArticle) break;
    }
    if (representativeArticle) break;
  }

  // ✅ 디버깅 로그
  useEffect(() => {
    console.log("🗂️ 카테고리 탐색:", foundCategory);
    console.log("📅 날짜:", articleDate);
    console.log("📰 대표뉴스:", representativeArticle);
  }, [representativeArticle]);

  useEffect(() => {
    console.log("🔁 현재 키워드:", currentKeyword);
  }, [currentKeyword]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 타이틀 + 드롭다운 */}
      <div className="flex items-center justify-between">
        <h2
          className="text-4xl text-[#111827] tracking-tight"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        >
          언론과 이슈
        </h2>

        <select
          value={period}
          onChange={handlePeriodChange}
          className="border border-gray-300 rounded-md text-sm p-2 text-gray-700 bg-white shadow-sm focus:outline-none"
        >
          {Object.entries(periodLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}간
            </option>
          ))}
        </select>
      </div>

      {/* 검색창 */}
      <div className="flex items-center gap-3 border border-[#D6D9E1] bg-white shadow-sm rounded-full px-5 py-3">
        <FaSearch className="text-[#6B7280]" />
        <div className="text-lg font-semibold text-[#333] transition-all duration-500 ease-in-out truncate">
          {currentKeyword}
        </div>
      </div>

      {/* 대표뉴스 카드 영역 */}
      <div className="w-full min-h-[120px] bg-[#F9FAFB] border border-dashed border-gray-300 rounded-md flex">
        {representativeArticle ? (
          <div className="w-1/2 flex">
            <RepresentativeNewsCard
              title={representativeArticle}
              summary={articleObj?.summary}
              url={articleObj?.url}
              date={articleDate || ""}
            />
          </div>
        ) : (
          <div className="w-1/2 flex items-center justify-center text-gray-400 text-sm">
            대표 뉴스가 없습니다.
          </div>
        )}

        {/* 오른쪽 영역 */}
        <div className="w-1/2 flex items-center justify-center text-gray-400 text-sm">
          다른 콘텐츠를 여기에 추가할 수 있습니다.
        </div>
      </div>
    </div>
  );
}
