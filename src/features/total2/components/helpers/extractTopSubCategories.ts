// features/total/helpers/extractTopSubCategories.ts
import type { PeriodKey } from "@/shared/types/common";

export interface SubCategoryTrend {
  mid: string;
  sub: string;
  count: number;
  newsArticle?: {
    title: string;
    url?: string;
    content?: string;
  };
  socialStats?: {
    agree: number;
    disagree: number;
    강화: number;
    완화: number;
  };
}

export function extractTopSubCategories(data: any, period: PeriodKey): SubCategoryTrend[] {
  const results: SubCategoryTrend[] = [];

  for (const category of Object.values(data)) {
    const newsEntries = category.news?.[period];
    const socialEntries = category.social?.[period];

    for (const dateKey in newsEntries) {
      const newsEntry = newsEntries[dateKey];
      const socialEntry = socialEntries?.[dateKey];

      for (const mid in newsEntry.중분류목록) {
        const newsSubs = newsEntry.중분류목록[mid]?.소분류목록 || {};
        const socialSubs = socialEntry?.중분류목록?.[mid]?.소분류목록 || {};

        for (const subKey in newsSubs) {
          const newsItem = newsSubs[subKey];
          const socialItem = socialSubs[subKey];

          const existing = results.find((r) => r.sub === subKey);
          if (existing) {
            existing.count += newsItem.count;
            continue;
          }

          results.push({
            mid,
            sub: subKey,
            count: newsItem.count,
            newsArticle: newsItem.articles?.[0] || null,
            socialStats: socialItem
              ? {
                  agree: socialItem.counts?.찬성 ?? 0,
                  disagree: socialItem.counts?.반대 ?? 0,
                  강화: socialItem.찬성?.개정강화?.count ?? 0,
                  완화: socialItem.찬성?.폐지약화?.count ?? 0,
                }
              : undefined,
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.count - a.count).slice(0, 5);
}
