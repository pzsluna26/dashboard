"use client";

import { PeriodKey } from "@/shared/types/common";

interface Props {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedPeriod: PeriodKey;
  onPeriodChange: (value: PeriodKey) => void;
}

const categories = [
  { value: "privacy", label: "개인정보 보호" },
  { value: "child", label: "아동·청소년" },
  { value: "safety", label: "안전·치안" },
  { value: "finance", label: "금융·경제" },
];

const periods: { key: PeriodKey; label: string }[] = [
  { key: "daily_timeline", label: "일간" },
  { key: "weekly_timeline", label: "주간" },
  { key: "monthly_timeline", label: "월간" },
];

export default function Sidebar({
  selectedCategory,
  onCategoryChange,
  selectedPeriod,
  onPeriodChange,
}: Props) {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-[220px] bg-white/60 border border-gray-200 rounded-xl shadow-xl p-5 space-y-6">
      <h2 className="text-sm font-bold text-[#55AD9B] tracking-tight">입법 필터</h2>
      {/* 카테고리 선택 */}
      <div> 
        <label className="text-xs text-gray-600 font-medium mb-1 block">법안 분류</label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#55AD9B] focus:outline-none">
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* 기간 선택 */}
      <div>
        <label className="text-xs text-gray-600 font-medium mb-1 block">기간</label>
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value as PeriodKey)}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#55AD9B] focus:outline-none">
          {periods.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
