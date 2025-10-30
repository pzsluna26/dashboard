// 종합분석 페이지 (Home: /)

"use client";
import { useState, useEffect, useMemo, useRef } from "react";

import KPISection from "@/features/news/components/KPISection";
import LawTrendChart from "@/features/news/components/LawTrendChart";
import LawRankingCard from "@/features/news/components/LawRankingCard";
import CoreInsightsCard from "@/features/news/components/CoreInsightsCard";

import { transformRawData } from "@/features/news/components/transformRawData";
import { computeKpis } from "@/shared/utils/computeKpis";

import type { PeriodKey } from "@/shared/types/common";

import Remote from "@/shared/layout/Remote";
import BackgroundGradient from "@/shared/layout/BackgroundGradient";
import Nav from "@/shared/layout/Nav";

function formatKR(d: string) {
  // YYYY-MM-DD -> YYYY.MM.DD
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${y}.${m}.${dd}`;
}

export default function Dashboard() {
  // period는 내부 aggregation용으로 유지할 수 있지만 셀렉트는 제거됩니다.
  const [period] = useState<PeriodKey>("weekly_timeline");

  const [data, setData] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);

  // ★ 조회기간 상태 (YYYY-MM-DD)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 설명에 노출할 텍스트: 기간 선택 시 "YYYY.MM.DD ~ YYYY.MM.DD", 미선택 시 안내 문구
  const displayPeriod = useMemo(() => {
    if (startDate && endDate) return `${formatKR(startDate)} ~ ${formatKR(endDate)}`;
    return "기간 미선택 (좌측 ‘기간선택’에서 최대 14일 범위를 지정하세요)";
  }, [startDate, endDate]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/data/data.json", { cache: "no-store" });
      const all = await res.json();
      setData(all);

      // ⬇️ 기간 필터를 transform/compute로 전달 (내부에서 처리하도록 확장)
      const transformed = transformRawData(all, period, { startDate, endDate });
      setTrend(transformed);

      const nextKpis = computeKpis(all, period, { startDate, endDate });
      setKpis(nextKpis);
    }
    fetchData();
    // ⬇️ 기간 변경 시에도 재계산
  }, [period, startDate, endDate]);

  if (!data || !trend || !kpis) {
    return (
      <div className="w-full h-screen grid place-items-center bg-[#C8D4E5] text-neutral-700">
        Loading...
      </div>
    );
  }

  const currentTitle = "종합분석";

  return (
    <div className="relative min-h-screen w-full text-neutral-900 overflow-hidden">
            <Nav title={currentTitle} period={period} showSearch={true} />
      
      {/* ✅ 배경: 컴포넌트 한 줄 */}
      <BackgroundGradient
        stops={["#ced7dc", "#eaebed", "#f6efec", "#f8e7e0"]}
        highlights
        glass
      />

      {/* 좌측 떠있는 리모컨 (기간 선택, 캡처/PDF 포함) */}
      <Remote
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
      />

      {/* ===== 콘텐츠 ===== */}
      <div className="flex w-full mx-auto mt-15">
        {/* (선택) 기존 사이드바 자리만 유지하고 싶다면 남겨둠 */}
        <aside className="w-[130px] flex flex-col items-center py-6">
          <div className="mt-10 w-35 h-16 rounded-full mb-10 overflow-hidden" />
          <div className="flex flex-col space-y-4 items-center">

          </div>
        </aside>

        {/* 메인 래퍼 */}
        <main
          className="flex flex-col p-10 bg-white/25 backdrop-blur-md
                     shadow-[0_12px_40px_rgba(20,30,60,0.05)] flex-1"
        >
          {/* 헤더 (셀렉트박스 제거) */}
          <div className="flex items-center justify-between px-7 py-5">
            <h2 className="font-jua mt-2 text-4xl md:text-5xl font-semibold text-[#2D2928] drop-shadow-sm">
              {currentTitle}
            </h2>
          </div>

          {/* 설명: 선택한 기간으로 표시 */}
          <div className="px-7 py-2 text-[#2D2928]/70">
            현재 <strong className="font-jua text-[#2D2928]">{displayPeriod}</strong> 기준으로{" "}
            <strong className="font-jua text-[#2D2928]">{currentTitle}</strong>을(를) 분석합니다.
          </div>

          {/* 본문 */}
          <div className="flex flex-col space-y-6">
            {/* ✅ KPISection에 periodLabel 문자열로 전달 */}
            <section>
              <div className="">
                <KPISection data={kpis} periodLabel={displayPeriod} />
              </div>
            </section>

            {/* 아래 컴포넌트들도 prop 이름이 'period'가 아니라 'periodLabel'이면 맞춰주세요 */}
            <section className="bg-white/35 backdrop-blur-md rounded-3xl p-4 border border-white/50">
              <LawTrendChart data={trend} period={displayPeriod} />
              {/* 만약 LawTrendChart도 PeriodKey를 요구한다면, prop 이름을 periodLabel로 바꾸고 타입을 string으로 수정하세요. */}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white/35 backdrop-blur-md rounded-2xl p-4 border border-white/50">
                <LawRankingCard data={kpis} periodLabel={displayPeriod} />
              </div>
              <div className="lg:col-span-2 h-full bg-white/35 backdrop-blur-md rounded-2xl p-4 border border-white/50">
                <CoreInsightsCard data={kpis} periodLabel={displayPeriod} trend={trend} />
              </div>
            </section>
          </div>

        </main>
      </div>
    </div>
  );
}
