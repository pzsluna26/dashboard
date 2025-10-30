// src/features/total/components/utils/computeRankings.ts
export interface RankingItem {
  category: string;
  total: number;
  trend?: number[]; // for sparkline
  label: string;
}

export function computeRankings(data: any, period: string) {
  const result = {
    개정강화: [] as RankingItem[],
    폐지완화: [] as RankingItem[],
    강한반대: [] as RankingItem[],
  };

  Object.entries(data).forEach(([cat, catData]: [string, any]) => {
    const socialTimeline = catData.social[period];
    const trendPoints: number[] = [];

    let totalAgreeStrong = 0;
    let totalAgreeWeak = 0;
    let totalDisagree = 0;

    Object.values(socialTimeline).forEach((entry: any) => {
      let agreeStrongSum = 0;
      let agreeWeakSum = 0;
      let disagreeSum = 0;

      Object.values(entry.중분류목록 || {}).forEach((mid: any) => {
        Object.values(mid.소분류목록 || {}).forEach((sub: any) => {
          agreeStrongSum += sub.찬성.개정강화.count;
          agreeWeakSum += sub.찬성.폐지약화.count;
          disagreeSum += sub.반대.소셜목록.length;
        });
      });

      totalAgreeStrong += agreeStrongSum;
      totalAgreeWeak += agreeWeakSum;
      totalDisagree += disagreeSum;

      // 트렌드용 최근 7일 스파크라인 데이터 누적
      trendPoints.push(agreeStrongSum + agreeWeakSum + disagreeSum);
    });

    result.개정강화.push({
      category: cat,
      total: totalAgreeStrong,
      label: "개정강화",
      trend: trendPoints.slice(-7),
    });
    result.폐지완화.push({
      category: cat,
      total: totalAgreeWeak,
      label: "폐지완화",
      trend: trendPoints.slice(-7),
    });
    result.강한반대.push({
      category: cat,
      total: totalDisagree,
      label: "강한반대",
      trend: trendPoints.slice(-7),
    });
  });

  // 내림차순 정렬 후 top 4 추출
  Object.keys(result).forEach((key) => {
    result[key as keyof typeof result].sort((a, b) => b.total - a.total);
    result[key as keyof typeof result] = result[key as keyof typeof result].slice(0, 4);
  });

  return result;
}
