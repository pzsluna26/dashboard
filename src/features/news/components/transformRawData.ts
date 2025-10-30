// features/news/components/transformRawData.ts
// 종합분석(누적그래프,핵심인사이트)
// 법안별 날짜, 뉴스합계, 소셜합계, 디테일(메타정보)
// trend

import type { PeriodKey, CategoryKey } from "@/shared/types/common";
import type { Detail } from "@/shared/types/common";
import { getSocialValue } from "@/shared/utils/computeKpis";

/** 외부에서 넘길 수 있는 기간 필터(YYYY-MM-DD) */
type DateRange = { startDate?: string; endDate?: string };

/** YYYY-MM-DD 형식인지 간단 판별 */
function isISODateKey(key: string) {
  // 예: 2025-08-16
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/** 문자열 비교(YYYY-MM-DD)로 범위 내인지 체크 */
function inRange(dateKey: string, range?: DateRange) {
  if (!range?.startDate || !range?.endDate) return true;
  if (!isISODateKey(dateKey)) return true; // 주/월 키는 필터 패스(주/월 모드에서는 상위에서 집계 권장)
  return range.startDate <= dateKey && dateKey <= range.endDate;
}

type LawTrendChartData = {
  name: CategoryKey;
  data: {
    date: string;
    news: number;
    social: number;
    detail?: Detail;
    rawSocial?: any;
  }[];
};

/**
 * 원본(raw)에서 기간/주기별 트렌드 데이터로 변환
 * - `range`가 있으면 일(YYYY-MM-DD) 키에만 필터 적용
 * - 뉴스/소셜 타임라인이 비어도 안전하게 처리
 * - detail: (해당 날짜에서) 가장 기사 많은 중분류/소분류 대표
 */
export function transformRawData(
  raw: Record<CategoryKey, any>,
  period: PeriodKey,
  range?: DateRange
): LawTrendChartData[] {
  const lawKeys = Object.keys(raw) as CategoryKey[];

  return lawKeys.map((law) => {
    const newsTL = raw?.[law]?.news?.[period] ?? {};
    const socialTL = raw?.[law]?.social?.[period] ?? {};

    // 기본은 뉴스 타임라인의 키를 x축으로 사용
    let dateKeys = Object.keys(newsTL);

    // 뉴스가 완전히 비어있다면 소셜 키라도 사용
    if (dateKeys.length === 0) {
      dateKeys = Object.keys(socialTL);
    }

    // 기간 필터(YYYY-MM-DD일 때만 적용)
    dateKeys = dateKeys.filter((d) => inRange(d, range)).sort();

    const entries = dateKeys.map((date) => {
      const midMap = newsTL?.[date]?.["중분류목록"] ?? {};
      let detail: Detail | undefined;

      // 1) 기사 수(count) 최다 중분류(mid)
      let bestMid: string | null = null;
      let bestMidCount = -1;

      for (const [mid, midVal] of Object.entries<any>(midMap)) {
        const c = Number(midVal?.count ?? 0);
        if (c > bestMidCount) {
          bestMidCount = c;
          bestMid = mid;
        }
      }

      // 2) 해당 중분류 내 최다 소분류(sub)
      if (bestMid) {
        const subMap = (midMap[bestMid] as any)?.["소분류목록"] ?? {};
        let bestSub:
          | { name: string; count: number; article?: any }
          | null = null;

        for (const [subName, subVal] of Object.entries<any>(subMap)) {
          const c = Number(subVal?.count ?? 0);
          if (!bestSub || c > bestSub.count) {
            bestSub = {
              name: subName,
              count: c,
              article: Array.isArray(subVal?.articles) ? subVal.articles[0] : undefined,
            };
          }
        }

        if (!bestSub) {
          bestSub = {
            name: "(소분류 없음)",
            count: Number((midMap[bestMid] as any)?.count ?? 0),
            article: undefined,
          };
        }

        detail = {
          mid: bestMid,
          sub: { title: bestSub.name },
          count: bestSub.count,
          article: bestSub.article,
        };
      }

      // 뉴스 합계
      const newsTotal = Object.values<any>(midMap).reduce(
        (sum, cur) => sum + Number(cur?.count ?? 0),
        0
      );

      // 소셜 합계(찬성+반대)
      const socialEntry = socialTL?.[date];
      const rawSocial =
        (socialEntry && typeof socialEntry === "object" && "counts" in socialEntry)
          ? (socialEntry as any).counts
          : socialEntry ?? {};
      const socialTotal = getSocialValue(rawSocial);

      return {
        date,
        news: newsTotal,
        social: socialTotal,
        detail,
        rawSocial,
      };
    });

    return { name: law, data: entries };
  });
}
