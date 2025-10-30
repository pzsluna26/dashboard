"use client";

import React, { useMemo } from "react";

type Props = {
  data: any;
  period: "daily_timeline" | "weekly_timeline" | "monthly_timeline";
};

const TopSubcategories = ({ data, period }: Props) => {
  const top5 = useMemo(() => {
    if (!data?.news?.[period]) return [];

    const timeline = data.news[period];
    const entries = Object.entries(timeline);

    if (entries.length === 0) return [];

    const [_, latestData] = entries[entries.length - 1];
    const midMap = latestData["중분류목록"];

    const topMid = Object.entries(midMap).sort((a, b) => b[1].count - a[1].count)[0];
    if (!topMid) return [];

    const subMap = topMid[1]["소분류목록"];

    return Object.entries(subMap)
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data, period]);

  return (
    <div className="flex flex-wrap justify-center gap-6 relative">
      {top5.map((sub, idx) => (
        <div
          key={idx}
          className="relative z-[1] w-[calc(33.3%-22px)] min-h-[235px] inline-block align-top bg-[#fff7ec] border border-[#f2e9dc] mx-[10px] box-border rounded-[27px_0_57px_17px] shadow-[2px_2px_12px_rgba(138,88,0,0.2)] pt-[50px] px-6"
        >
          {/* 타이틀 */}
          <div
            className="absolute left-[10px] top-[-27px] inline-block w-[187px] h-[57px] text-[17px] font-bold box-border pt-[15px] text-center mb-[5px] bg-[#744a03] rounded-[50px] text-white"
            style={{ fontFamily: '"Noto Sans KR", sans-serif' }}
          >
            {sub.key}
          </div>

          {/* 본문 */}
          <p className="text-sm text-gray-700 mb-4">관련법: {sub["관련법"]}</p>
          <p className="text-sm text-gray-500">뉴스 수: {sub.count}</p>
          <p className="text-sm mt-2">대표뉴스: {sub.대표뉴스}</p>
        </div>
      ))}
    </div>
  );
};

export default TopSubcategories;
