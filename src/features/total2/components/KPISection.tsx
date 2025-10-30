"use client";

import { LAW_LABEL } from "@/shared/constants/labels";
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";
import { PeriodKey } from "@/shared/types/common";

type KPIProps = {
  data: {
    name: string;
    value: number;
    growthRate: number;
    socialTotal: number;
    trend?: number[];
  }[];
  period: PeriodKey;
  setPeriod: (period: PeriodKey) => void;
};

const periodOptions: { label: string; value: PeriodKey }[] = [
  { label: "일간", value: "daily_timeline" },
  { label: "주간", value: "weekly_timeline" },
  { label: "월간", value: "monthly_timeline" },
];

export default function KPISection({ data, period, setPeriod }: KPIProps) {
  return (
    <div className="text-neutral-700 w-full py-12">
      {/* ✅ 타이틀 + 셀렉트 한 줄 정렬 */}
      <div className="relative w-full flex items-center justify-center mb-12 px-6 md:px-12">
        {/* 타이틀 중앙 */}
        <h3
          className="text-4xl text-[#111827] tracking-tight text-center absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        >
          법안 요약 지표
        </h3>

        {/* 셀렉트박스: 오른쪽 끝 (카드라인 맞춤) */}
        <div className="ml-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ KPI 카드 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 place-items-center px-6 md:px-12">
        {data.map((item) => {
          const isUp = item.growthRate >= 0;
          const color = isUp ? "#AD8B73" : "#E3CAA5";
          const textColor = "text-[#1e293b]";
          const imagePath = `/images/${item.name}.jpg`;

          return (
            <div
              key={item.name}
              className="w-[270px] h-[360px] rounded-[0_0_90px_0] overflow-hidden shadow-md hover:shadow-xl transition-transform hover:scale-105 bg-white border border-gray-200"
            >
              {/* 이미지 */}
              <div
                className="h-[55%] w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${imagePath})` }}
              />

              {/* 콘텐츠 */}
              <div className="h-[45%] bg-white px-10 py-4 flex flex-col items-center justify-between">
                {/* 차트 */}
                <div className="h-[40px] w-full mb-1">
                  {item.trend && item.trend.length > 1 ? (
                    <Sparklines data={item.trend} margin={3}>
                      <SparklinesLine
                        color={color}
                        style={{ fill: "none", strokeWidth: 3 }}
                      />
                      <SparklinesSpots size={2} style={{ fill: color }} />
                    </Sparklines>
                  ) : (
                    <div className="h-[40px] flex items-center justify-center text-xs text-gray-400">
                      데이터 부족
                    </div>
                  )}
                </div>

                {/* 값 */}
                <div className={`text-base font-bold ${textColor}`}>
                  {item.value.toLocaleString()} /{" "}
                  {item.socialTotal.toLocaleString()}
                </div>

                {/* 증감률 */}
                <div className="text-xs font-medium mt-1">
                  전 기간 대비{" "}
                  <span className={isUp ? "text-red-300" : "text-blue-300"}>
                    {isUp ? "▲" : "▼"} {item.growthRate.toFixed(1)}%
                  </span>
                </div>

                {/* 법안명 */}
                <div className="text-[11px] text-gray-500 font-medium mt-1 truncate text-center w-full">
                  {LAW_LABEL[item.name as keyof typeof LAW_LABEL] ?? item.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
