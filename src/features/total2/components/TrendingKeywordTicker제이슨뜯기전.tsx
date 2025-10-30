"use client";

import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { PeriodKey, PeriodLabel } from "@/shared/types/common";

import ArticleCard from "./ArticleCard";
import SocialReactionChart from "./SocialReactionChart";
import MentionTrendChart from "./MentionTrendChart";

import {
  extractTopSubCategories,
  SubCategoryTrend,
} from "@/features/total/components/helpers/extractTopSubCategories";

import { getMentionTrendForSub } from "./helpers/getMentionTrendForSub";

interface Props {
  data: any;
  period: PeriodKey;
  setPeriod: (period: PeriodKey) => void;
}

export default function TrendingKeywordTicker({ data, period, setPeriod }: Props) {
  const [index, setIndex] = useState(0);
  const [keywords, setKeywords] = useState<SubCategoryTrend[]>([]);

  const periodLabels: Record<PeriodKey, PeriodLabel> = {
    daily_timeline: "일",
    weekly_timeline: "주",
    monthly_timeline: "월",
  };

  useEffect(() => {
    if (!data?.all) return;

    // ✅ 새 JSON 구조 기준으로 추출된 소분류 키워드 리스트 생성
    const extracted = extractTopSubCategories(data.all, period); // ✅ 구조에 맞게 업데이트된 함수여야 함
    setKeywords(extracted);
    setIndex(0);
  }, [data, period]);

  useEffect(() => {
    if (!keywords.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % keywords.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [keywords]);

  const current = keywords[index];
  const trendData = current
    ? getMentionTrendForSub(data.all, current.sub, period)
    : [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* 제목 */}
      <div className="text-center">
        <h2
          className="text-4xl text-gray-900 tracking-tight"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        >
          이슈와 언론 및 여론 동향
        </h2>
        <p className="text-neutral-500 mt-2 text-sm">
          종합 데이터를 기반으로 요약된 정보를 제공합니다.
        </p>
      </div>

      {/* 검색창 + 기간 선택 */}
      <div className="relative flex items-center justify-center w-full px-7 md:px-12">
        <div className="flex items-center gap-5 border border-[#55AD9B] bg-white shadow rounded-2xl px-10 py-3 w-[600px] mx-auto">
          <FaSearch className="text-gray-600" />
          <div className="flex items-center gap-3 text-gray-700 sm:text-lg truncate">
            <span
              style={{
                backgroundColor: "#95D2B3",
                color: "white",
                fontWeight: "bold",
                borderRadius: "6px",
                padding: "2px 8px",
                minWidth: "32px",
                textAlign: "center",
              }}
            >
              {index + 1}
            </span>
            <p style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
              {current?.sub ?? "키워드 없음"}
            </p>
          </div>
        </div>

        <div className="absolute right-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {Object.entries(periodLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}간
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 카드 섹션 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 기사 */}
        <ArticleCard
          articleTitle={current?.newsArticle?.title}
          articleUrl={current?.newsArticle?.url}
          summary={current?.newsArticle?.content}
        />

        {/* 여론 */}
        <div className="w-full h-[250px]">
          <div className="bg-white shadow-md border border-gray-200 p-6 h-full flex flex-col justify-between hover:shadow-xl">
            <div className="flex-1">
              <h3 className="flex items-center gap-2 text-neutral-700 font-bold text-lg mb-3">
                <img src="/icons/msg.png" className="w-6 h-6 object-contain" />
                여론반응
              </h3>
              {current?.socialStats ? (
                <SocialReactionChart
                  agree={current.socialStats.agree}
                  disagree={current.socialStats.disagree}
                  강화={current.socialStats.강화}
                  완화={current.socialStats.완화}
                />
              ) : (
                <div className="text-gray-400 text-sm flex justify-center items-center h-full">
                  데이터 없음
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 언급량 추이 */}
        <div className="w-full h-[250px]">
          <div className="bg-white shadow-md border border-gray-200 p-6 h-full flex flex-col hover:shadow-xl">
            <h3 className="flex items-center gap-2 text-neutral-700 font-bold text-lg mb-3">
              <img src="/icons/graph.png" className="w-6 h-6 object-contain" />
              언급량 추이
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <MentionTrendChart
                data={trendData}
                period={period}
                width={260}
                height={160}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
