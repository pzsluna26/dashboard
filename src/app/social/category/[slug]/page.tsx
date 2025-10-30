"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CATEGORIES } from "@/shared/constants/navigation";
import { PeriodKey } from "@/shared/types/common";
import { PERIOD_LABEL_MAP } from "@/shared/constants/labels";
import Nav from "@/shared/layout/Nav";
import SocialAnalysisPanel from "@/features/social2/components/SocialAnalysisPanel";
import PeriodSelect from "@/features/news/components/NivoTrendChart/PeriodSelect";
import SummaryCard from "@/features/social2/components/SummaryCard";
import RelatedLawSummary from "@/features/social2/components/RelatedLawSummary";

// ✅ API 요청용 기간 맵
const PERIOD_API_MAP = {
  daily_timeline: "daily",
  weekly_timeline: "weekly",
  monthly_timeline: "monthly",
} as const;

export default function SocialPage() {
  const [data, setData] = useState<any>(null);
  const params = useParams();
  const [period, setPeriod] = useState<PeriodKey>("weekly_timeline");

  const slugRaw = params?.slug as string | string[];
  const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;
  const periodLabel = PERIOD_LABEL_MAP[period];

  const currentCat = useMemo(
    () => CATEGORIES.find((c) => c.key === slug) ?? CATEGORIES[0],
    [slug]
  );

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({
    first: null,
    second: null,
    third: null,
    fourth: null,
  });

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      try {
        const apiPeriod = PERIOD_API_MAP[period];
        const res = await fetch(
          // `http://10.125.121.213:8080/api/social/category/${slug}/${apiPeriod}`,
            "/data/data.json", 
          { cache: "no-store" }
        );

        if (!res.ok) {
          console.error("❌ API Error:", res.status);
          return;
        }

        const all = await res.json();
        setData(all[slug]); // ✅ law key 기준으로 추출
      } catch (err) {
        console.error("❌ Fetch error:", err);
      }
    }

    fetchData();
  }, [slug, period]);

  if (!data) {
    return (
      <div className="w-full h-screen grid place-items-center bg-white text-neutral-700">
        Loading...
      </div>
    );
  }

  // ✅ 가장 최신 주/월 선택
  const timeline = data?.social?.[period] || {};
  const latestKey = Object.keys(timeline).sort().reverse()[0];
  const currentSocialData = timeline[latestKey];

  return (
    <div className="relative min-h-screen w-full text-neutral-700 overflow-auto bg-white">
      {/* Nav */}
      <div className="z-10 sticky top-0">
        <Nav
          title={`${currentCat.name} 여론분석`}
          period={period}
          setPeriod={setPeriod}
          showSearch={true}
        />
      </div>

      {/* 네비게이션 점 */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-6 z-50">
        {["first", "second", "third", "fourth"].map((id) => (
          <button
            key={id}
            className="w-4 h-4 rounded-full bg-gray-400 hover:bg-gray-800 transition-all duration-300"
            onClick={() =>
              sectionRefs.current[id]?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          />
        ))}
      </div>

      {/* 메인 영역 */}
      <div className="flex w-full h-full">
        <main className="flex-1 flex flex-col bg-white/25 backdrop-blur-md shadow-[0_12px_40px_rgba(20,30,60,0.12)] overflow-y-auto scroll-smooth">
          {/* Hero */}
          <div
            ref={(el) => (sectionRefs.current.first = el)}
            className="relative min-h-[40vh] flex items-center justify-center bg-white text-white"
          >
            <div className="absolute inset-0 z-0 overflow-hidden rounded-br-[250px]">
              <img
                src="/main/main1.jpg"
                alt="Dashboard Intro"
                className="w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
            </div>

            <div className="relative z-10 w-[90%] mx-auto px-3 py-2 scroll-mt-[100px]">
              <h2
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
                className="text-3xl md:text-5xl mt-20"
              >
                '{currentCat.name}' 여론분석
              </h2>
              <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <p className="text-lg">
                  현재 <strong>{periodLabel}</strong> 단위로{" "}
                  <strong>{currentCat.name}</strong>이(가) 분석됩니다.
                </p>
                <PeriodSelect value={period} onChange={setPeriod} />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div
            ref={(el) => (sectionRefs.current.second = el)}
            className="w-full bg-white flex items-center "
          >
            <div className="w-[90%] mx-auto py-20">
              <SummaryCard slug={slug} socialData={currentSocialData} />
            </div>
          </div>

          {/* 분석 차트 패널 */}
          <div
            ref={(el) => (sectionRefs.current.third = el)}
            className="w-full h-[220vh] bg-[#FFFDF6] flex items-center"
          >
            <div className="w-[80%] mx-auto">
              <SocialAnalysisPanel
                socialData={timeline}
                periodLabel={periodLabel}
              />
            </div>
          </div>

          {/* 관련법 요약 */}
          <div
            ref={(el) => (sectionRefs.current.fourth = el)}
            className="w-full min-h-screen bg-white flex items-center"
          >
            <div className="w-[80%] mx-auto py-20">
              <RelatedLawSummary socialTimeline={timeline} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
