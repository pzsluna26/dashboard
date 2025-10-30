// src/features/total/components/RankingSparkline.tsx
"use client";

import { FC } from "react";

interface Props {
  trend?: number[];
}

const RankingSparkline: FC<Props> = ({ trend = [] }) => {
  if (trend.length < 2) return null;
  const max = Math.max(...trend);
  const points = trend
    .map((v, i) => `${(i / (trend.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <svg width="80" height="30" viewBox="0 0 100 100" className="text-blue-500">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};

export default RankingSparkline;
