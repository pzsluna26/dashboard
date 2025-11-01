// app/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";

import KpiSummary from "@/features/news/components/KpiSummary";
import { transformRawData } from "@/features/news/components/transformRawData";
import { computeKpis } from "@/shared/utils/computeKpis";
import type { PeriodKey } from "@/shared/types/common";

import Remote from "@/shared/layout/Remote";
import BackgroundGradient from "@/shared/layout/BackgroundGradient";
import Nav from "@/shared/layout/Nav";

function formatKR(d: string) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${y}.${m}.${dd}`;
}

export default function Dashboard() {
  const [period] = useState<PeriodKey>("weekly_timeline");

  const [data, setData] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);

  // ✅ Remote(좌측 리모컨)에서 제어되는 조회기간
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const displayPeriod = useMemo(() => {
    if (startDate && endDate) return `${formatKR(startDate)} ~ ${formatKR(endDate)}`;
    return "기간 미선택 (좌측 ‘기간선택’에서 최대 14일 범위를 지정하세요)";
  }, [startDate, endDate]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/data/data.json", { cache: "no-store" });
      const all = await res.json();
      setData(all);

      // ✅ 기간 필터를 transform/compute에 전달
      const transformed = transformRawData(all, period, { startDate, endDate });
      setTrend(transformed);

      const nextKpis = computeKpis(all, period, { startDate, endDate });
      setKpis(nextKpis);
    }
    fetchData();
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
      <BackgroundGradient
        stops={["#ced7dc", "#eaebed", "#f6efec", "#f8e7e0"]}
        highlights
        glass
      />

      <Remote
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
      />

      <div className="flex w-full mx-auto mt-15">
        <aside className="w-[130px] flex flex-col items-center py-6" />
        <main
          className="flex flex-col p-10 bg-white/25 backdrop-blur-md
                     shadow-[0_12px_40px_rgba(20,30,60,0.05)] flex-1"
        >
          <div className="flex items-center justify-between px-7 py-5">
            <h2 className="font-jua mt-2 text-4xl md:text-5xl font-semibold text-[#2D2928] drop-shadow-sm">
              {currentTitle}
            </h2>
          </div>

          <div className="px-7 py-2 text-[#2D2928]/70">
            현재 <strong className="font-jua text-[#2D2928]">{displayPeriod}</strong> 기준으로{" "}
            <strong className="font-jua text-[#2D2928]">{currentTitle}</strong>을(를) 분석합니다.
          </div>

          <div className="flex flex-col space-y-6">
            <section>{/* (공란 유지 가능) */}</section>

            {/* ✅ 두번째 섹션: 좌 2/3( KPI ), 우 1/3(보조패널) */}
            <section className="bg-white/35 backdrop-blur-md rounded-3xl p-4 border border-white/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 좌측 2/3: KPI 요약지표 */}
                <div className="lg:col-span-2">
                  <KpiSummary
                    kpis={kpis}
                    periodLabel={displayPeriod}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </div>

                {/* 우측 1/3: 보조 패널(원하면 비워두세요) */}
                <aside className="lg:col-span-1">
                  <div className="h-full rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
                    <div className="text-sm text-neutral-500 font-medium">보조 패널</div>
                    <div className="mt-2 text-sm text-neutral-700">
                      • 기간: {displayPeriod}
                      <br />
                      • 안내/필터/요약 노트 등 배치
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            {/* 아래 영역은 그대로 유지 */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white/35 backdrop-blur-md rounded-2xl p-4 border border-white/50" />
              <div className="lg:col-span-2 h-full bg-white/35 backdrop-blur-md rounded-2xl p-4 border border-white/50" />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
