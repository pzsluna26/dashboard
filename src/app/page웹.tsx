"use client";

import { useRef, useState } from "react";
import CoreInsightsCard from "@/features/total/components/CoreInsightsCard";
import LawRankingSection from "@/features/total/components/LawRankingSection";
import Nav from "@/shared/layout/Nav";
import TrendingKeywordTicker from "@/features/total/components/TrendingKeywordTicker";
import { PERIOD_LABEL_MAP } from "@/shared/constants/labels";
import type { PeriodKey } from "@/shared/types/common";
import { PeriodProvider } from "@/shared/contexts/PeriodContext";

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("weekly_timeline");

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({
    first: null,
    second: null,
    third: null,
    fourth: null,
    fifth: null,
  });

  const currentTitle = "종합분석";

  return (
    <PeriodProvider value={{ period, setPeriod }}>
      <Nav title={currentTitle} period={period} setPeriod={setPeriod} showSearch={true} />

      <div className="relative min-h-screen w-full text-neutral-900 overflow-auto">
        {/* 점 네비게이션 */}
        <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-6 z-50">
          {["first", "second", "third", "fourth", "fifth"].map((id) => (
            <button
              key={id}
              className="w-4 h-4 rounded-full bg-gray-300/70 hover:bg-gray-500/50 transition-all duration-300"
              onClick={() => {
                sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          ))}
        </div>

        <main className="flex flex-col scroll-smooth">
          {/* 1️⃣ 첫 번째 섹션 */}
          <div
            ref={(el) => (sectionRefs.current.first = el)}
            className="relative min-h-[90vh] flex items-center justify-center bg-white"
          >
            <div className="absolute inset-0 z-0 overflow-hidden rounded-br-[250px]">
              <img src="/main/main1.jpg" alt="Dashboard Intro" className="w-full h-full object-cover brightness-95" />
              <div className="absolute inset-0 backdrop-blur-xs bg-black/30" />
            </div>

            <div className="relative z-10 w-[90%] mx-auto text-center text-white max-w-4xl">
              <p className="text-lg text-white/80 font-light tracking-wide mb-4">
                뉴스 및 소셜 데이터를 활용한 AI 입법 수요 분석 서비스 플랫폼
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white/80 drop-shadow-md mb-6">
                당신의 <span className="">든든한 법률 파트너 여론나침반</span>
              </h1>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                잠재적인 입법 수요를 탐지하고, 각 수요의 사회적 중요도와
                <br className="hidden md:block" />
                사회적 파급력 및 시급성을 정량적으로 평가하는 AI 서비스를 제공합니다.
              </p>
            </div>
          </div>

          {/* 2️⃣ 트렌드 키워드 — 섹션 내부 fetch */}
          <div
            ref={(el) => (sectionRefs.current.second = el)}
            className="min-h-screen bg-white flex items-center"
          >
            <div className="w-[80%] mx-auto py-20 space-y-8">
              <TrendingKeywordTicker />
            </div>
          </div>

          {/* 3️⃣ 법안 랭킹 — 섹션 내부 fetch */}
          <div
            ref={(el) => (sectionRefs.current.third = el)}
            className="min-h-screen bg-[#FFFDF6] flex items-center"
          >
            <div className="w-[80%] mx-auto py-20 flex flex-col items-center">
              <LawRankingSection />
            </div>
          </div>

          {/* 4️⃣ 인사이트 카드 — 섹션 내부 fetch */}
          <div
            ref={(el) => (sectionRefs.current.fourth = el)}
            className="min-h-screen bg-white flex items-center"
          >
            <div className="w-[80%] mx-auto py-20">
              {/* <CoreInsightsCard periodLabel={PERIOD_LABEL_MAP[period]} /> */}
            </div>
          </div>
        </main>
      </div>
    </PeriodProvider>
  );
}
