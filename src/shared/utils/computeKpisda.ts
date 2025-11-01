// utils/computeKpis.ts
import { parseISO, isAfter, isBefore } from "date-fns";

// 타임라인 키
type PeriodKey = "daily_timeline" | "weekly_timeline" | "monthly_timeline";

type Range = { startDate?: string; endDate?: string };

function inRange(key: string, { startDate, endDate }: Range, period: PeriodKey) {
  if (!startDate && !endDate) return true;
  // key 형식:
  // daily:   'YYYY-MM-DD'
  // weekly:  'YYYY-Wxx'  (주의: Date 파싱 불가 → 문자열 비교)
  // monthly: 'YYYY-MM'   (문자열 비교)
  if (period === "daily_timeline") {
    const d = parseISO(key); // YYYY-MM-DD
    if (startDate && isBefore(d, parseISO(startDate))) return false;
    if (endDate && isAfter(d, parseISO(endDate))) return false;
    return true;
  }
  // 주/월은 문자열 범위 비교(키가 사전순 정렬이 날짜 순서와 일치)
  if (startDate && key < startDate) return false;
  if (endDate && key > endDate) return false;
  return true;
}

function sumNewsEntry(entry: any) {
  // entry = { 중분류목록: { [mid]: { count, 소분류목록: {...} } } }
  if (!entry?.["중분류목록"]) return 0;
  let total = 0;
  for (const mid of Object.keys(entry["중분류목록"])) {
    const m = entry["중분류목록"][mid];
    // 중분류 count를 그대로 합산 (원하면 소분류의 count 합으로 대체 가능)
    total += Number(m?.count || 0);
  }
  return total;
}

function sumSocialEntry(entry: any) {
  // entry = { counts: { 찬성, 반대 }, ... }
  const agree = Number(entry?.counts?.["찬성"] || 0);
  const disagree = Number(entry?.counts?.["반대"] || 0);
  return agree + disagree;
}

export function computeKpis(
  all: any,
  period: PeriodKey,
  range: Range
) {
  const categories = ["privacy", "child", "safety", "finance"] as const;

  const results = categories.map((cat) => {
    const newsTL = all?.[cat]?.news?.[period] || {};
    const socialTL = all?.[cat]?.social?.[period] || {};

    // 날짜 키 정렬 (문자열 정렬로 OK: YYYY-MM-DD / YYYY-Wxx / YYYY-MM)
    const dateKeys = Object.keys(newsTL).sort().filter((k) => inRange(k, range, period));

    // 시계열 만들기
    const seriesPoints = dateKeys.map((k) => ({
      date: k,
      value: sumNewsEntry(newsTL[k]),
    }));

    const socialSeriesPoints = dateKeys.map((k) => ({
      date: k,
      value: sumSocialEntry(socialTL[k] ?? {}),
    }));

    // 총합/현재값(원하면 마지막 구간 값, 평균 등으로 변경)
    const totalValue = seriesPoints.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

    // 성장률(예: 이전 동일 길이 구간 대비) — 간단히 0으로 두거나 필요 시 계산 로직 추가
    const growthRate = 0;

    return {
      name: cat,                // ← KpiSummary 배열 모드에서 label로 사용됨
      value: totalValue,        // 카드 메인 값
      growthRate,               // 카드 보조 지표
      seriesPoints,             // ✅ 날짜포인트 시계열
      socialSeriesPoints,       // ✅ 소셜 시계열(찬성+반대)
      suffix: "건",
    };
  });

  return results;
}
