"use client";

import { LAW_LABEL } from "@/shared/constants/labels";
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";
import InfoTooltip from "@/shared/layout/InfoTooltip";

// KPI 데이터 타입
type KPIProps = {
  data: {
    name: string;
    value: number;
    growthRate: number;
    socialTotal: number;
    trend?: number[];
  }[];
  period: string;
};

export default function KPISection({ data, period }: KPIProps) {
  return (
    <div className="text-neutral-700 w-full py-12">
      {/* 타이틀 */}
      <div className="flex items-center mb-12 gap-2 justify-center">
        <h3
          className="text-4xl text-[#111827] tracking-tight text-center"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }} // 
        >
          전체 법안 요약 지표
        </h3>
        {/* <InfoTooltip>
          <p>
            전체 법안들의 데이터 중 가장 최근 <strong>{period}별</strong> 기사량, 소셜 언급량,
            <br />
            전 기간 대비 기사 수 증감률 정보를 요약한 지표입니다.
          </p>
        </InfoTooltip> */}
      </div>

      {/* KPI 카드 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 place-items-center">
        {data.map((item, index) => {
          const isUp = item.growthRate >= 0;
          const color = isUp ? "#60a5fa" : "#93c5fd";

          const textColor = "text-[#1e293b]";

          // 지그재그 위치 조정
          const positionClass =
            index % 2 === 0
              ? "translate-y-2 md:translate-y-4"
              : "-translate-y-2 md:-translate-y-4";

          // ✅ 이미지 경로 (동그라미 자체 배경으로)
          const imagePath = `/images/${item.name}.jpg`;

          return (
            <div
              key={item.name}
              className={`relative w-[200px] h-[200px] rounded-full overflow-hidden
                          flex flex-col items-center justify-center 
                          transition-all duration-300 shadow-md hover:shadow-xl 
                          hover:scale-105 ${positionClass}`}
              style={{
                backgroundImage: `url(${imagePath})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: "#f1f5f9",
              }}
            >
              {/* 🔹 반투명 오버레이 (텍스트 가독성용) */}
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px]" />

              {/* 🔹 내부 내용 */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                {/* 미니 차트 */}
                <div className="h-[50px] w-[70%]">
                  {item.trend && item.trend.length > 1 ? (
                    <Sparklines data={item.trend} margin={4}>
                      <SparklinesLine
                        color={color}
                        style={{ fill: "none", strokeWidth: 4 }}
                      />
                      <SparklinesSpots size={2} style={{ fill: color }} />
                    </Sparklines>
                  ) : (
                    <div className="h-[50px] flex items-center justify-center text-xs text-gray-400">
                      데이터 부족
                    </div>
                  )}
                </div>

                {/* 값 */}
                <div className={`text-lg font-bold mt-2 ${textColor}`}>
                  {item.value.toLocaleString()} / {item.socialTotal.toLocaleString()}
                </div>

                {/* 증감률 */}
                <div className="text-xs font-medium mt-1">
                  전{period} 대비{" "}
                  <span className={isUp ? "text-blue-500" : "text-blue-300"}>
                    {isUp ? "▲" : "▼"} {item.growthRate.toFixed(1)}%
                  </span>
                </div>

                {/* 법안명 */}
                <div className="text-[11px] text-gray-500 font-medium mt-1 truncate w-[90%] text-center">
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
