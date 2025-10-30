// features/total/components/helpers/getMentionTrendForSub.ts
import { PeriodKey } from "@/shared/types/common";

export function getMentionTrendForSub(data: any, subKey: string, period: PeriodKey) {
  const timeline: Record<string, { news: number; social: number }> = {};

  for (const category of Object.values(data)) {
    const newsTimeline = category.news?.[period];
    const socialTimeline = category.social?.[period];

    if (!newsTimeline || !socialTimeline) continue;

    for (const dateKey in newsTimeline) {
      const newsEntry = newsTimeline[dateKey];
      const socialEntry = socialTimeline?.[dateKey];

      for (const mid in newsEntry.중분류목록) {
        const newsSub = newsEntry.중분류목록[mid]?.소분류목록?.[subKey];
        const socialSub = socialEntry?.중분류목록?.[mid]?.소분류목록?.[subKey];

        if (!timeline[dateKey]) timeline[dateKey] = { news: 0, social: 0 };

        if (newsSub) timeline[dateKey].news += newsSub.count;
        if (socialSub) timeline[dateKey].social += socialSub.count;
      }
    }
  }

  return Object.entries(timeline)
    .map(([date, counts]) => ({
      date,
      news: counts.news,
      social: counts.social,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
