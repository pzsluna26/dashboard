// 날짜 포맷터

"use client";
import { useMemo } from "react";

export const useBottomTicks = (periodLabel?: string, sortedDates: string[] = []) => {
  const isDaily  = useMemo(() => /일|daily/i.test(periodLabel ?? ""), [periodLabel]);
  const isWeekly = useMemo(() => /주|weekly/i.test(periodLabel ?? ""), [periodLabel]);
  const isMonthly= useMemo(() => /월|monthly/i.test(periodLabel ?? ""), [periodLabel]);

  // ISO 주 → 월요일 날짜, 그리고 그 달의 몇째주인지 구하는 헬퍼
  function isoWeekToMondayUTC(year: number, week: number): Date {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4DowMon0 = (jan4.getUTCDay() + 6) % 7; // 월=0
    const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4DowMon0));
    const monday = new Date(week1Monday);
    monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
    return monday;
  }
  function weekOfMonthMondayUTC(d: Date): number {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const firstDowMon0 = (first.getUTCDay() + 6) % 7; // 월=0
    const day = d.getUTCDate();
    return Math.floor((day + firstDowMon0 - 1) / 7) + 1;
  }

  const bottomTickFormatter = useMemo(() => {
    if (isDaily) {
      // YYYY-MM-DD -> MM/DD
      return (value: string) => {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? `${m[2]}월${m[3]}일` : value;
      };
    }
    if (isWeekly) {
      // YYYY-W## -> "M월 N째주"
      return (value: string) => {
        const m = value.match(/^(\d{4})-W(\d{2})$/);
        if (!m) return value;
        const year = Number(m[1]);
        const week = Number(m[2]);
        const monday = isoWeekToMondayUTC(year, week);
        const month = monday.getUTCMonth() + 1;
        const nth   = weekOfMonthMondayUTC(monday);
        return `${month}월 ${nth}째주`;
      };
    }
    if (isMonthly) {
      // YYYY-MM -> YY/MM
      return (value: string) => {
        const m = value.match(/^(\d{4})-(\d{2})$/);
        return m ? `${m[1].slice(2)}년${m[2]}월` : value;
      };
    }
    return undefined;
  }, [isDaily, isWeekly, isMonthly]);

  // 눈금 간격 (일 단위만 간격 줄이고, 주/월은 기본값 사용해도 OK)
  const bottomTickValues = useMemo(() => {
    if (!isDaily) return undefined;
    const MAX_TICKS = 12;
    const n = sortedDates.length;
    if (n <= MAX_TICKS) return sortedDates;
    const step = Math.ceil(n / MAX_TICKS);
    return sortedDates.filter((_, i) => i % step === 0);
  }, [isDaily, sortedDates]);

  return { bottomTickFormatter, bottomTickValues };
};