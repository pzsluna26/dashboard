// 종합분석(핵심인사이트)

"use client";
import Image from "next/image";

import type { KpiItem, Sentiment } from "@/shared/types/common";
import { LAW_LABEL } from "@/shared/constants/labels";
import { formatPeriodDate } from "@/shared/utils/period";
import { getSocialValue } from "@/shared/utils/computeKpis";

type TrendPoint = {
  date: string;
  news: number;
  social: number;
  detail?: {
    mid?: string;
    sub?: string;
    article?: { title?: string; url?: string; content?: string };
  };
  rawSocial?: Record<string, number>;
};

type TrendSeries = { name: string; data: TrendPoint[] };

export default function CoreInsightsCard({
  data,
  periodLabel,
  trend,
  className,
}: {
  data: KpiItem[];
  periodLabel: string;
  trend: TrendSeries[];
  className?: string;
}) {
  if (!data?.length) return null;

  const topVolume = [...data].sort((a, b) => b.value - a.value)[0];
  const topGrowth = [...data].sort((a, b) => b.growthRate - a.growthRate)[0];
  const topAmplification = [...data].sort(
    (a, b) =>
      getSocialValue(b.rawSocial) / Math.max(1, b.value) -
      getSocialValue(a.rawSocial) / Math.max(1, a.value)
  )[0];

  const topLawLean = getLawLean(topVolume.rawSocial);
  function getLawLean(rawSocial?: Record<Sentiment, number>): Sentiment | null {
    if (!rawSocial) return null;
    const agree = rawSocial["찬성"] ?? 0;
    const disagree = rawSocial["반대"] ?? 0;
    if (agree > disagree) return "찬성";
    if (disagree > agree) return "반대";
    return null;
  }

  const dateMap: Record<
    string,
    {
      news: number;
      social: number;
      newsDetail?: TrendPoint["detail"];
      socialDetail?: TrendPoint["detail"];
      maxNews: number;
      maxSocial: number;
    }
  > = {};

  for (const series of trend) {
    for (const point of series.data) {
      const { date, news = 0, social = 0, detail } = point;
      if (!dateMap[date]) {
        dateMap[date] = { news: 0, social: 0, maxNews: 0, maxSocial: 0 };
      }
      dateMap[date].news += news;
      dateMap[date].social += social;
      if (news > dateMap[date].maxNews && detail) {
        dateMap[date].maxNews = news;
        dateMap[date].newsDetail = detail;
      }
      if (social > dateMap[date].maxSocial && detail) {
        dateMap[date].maxSocial = social;
        dateMap[date].socialDetail = detail;
      }
    }
  }

  let newsPeakDate = "";
  let newsCount = 0;
  let newsDetail: TrendPoint["detail"] | undefined;

  let socialPeakDate = "";
  let socialCount = 0;
  let socialDetail: TrendPoint["detail"] | undefined;

  for (const [date, values] of Object.entries(dateMap)) {
    if (values.news > newsCount) {
      newsCount = values.news;
      newsPeakDate = date;
      newsDetail = values.newsDetail;
    }
    if (values.social > socialCount) {
      socialCount = values.social;
      socialPeakDate = date;
      socialDetail = values.socialDetail;
    }
  }

  const newsTitle =
    newsDetail?.article?.title ||
    (newsDetail?.mid && newsDetail?.sub ? `${newsDetail.mid}–${newsDetail.sub}` : "");

  const socialTitle =
    socialDetail?.article?.title ||
    (socialDetail?.mid && socialDetail?.sub ? `${socialDetail.mid}–${socialDetail.sub}` : "");

  const ratio =
    topAmplification.value > 0
      ? getSocialValue(topAmplification.rawSocial) / topAmplification.value
      : 0;

  const driver =
    ratio >= 0.9 ? "소셜 주도"
    : ratio >= 0.6 ? "소셜 우세"
    : ratio >= 0.4 ? "혼합"
    : ratio > 0 ? "언론 우세"
    : "언론 주도";

  const newsPeakLabel = newsPeakDate ? formatPeriodDate(periodLabel, newsPeakDate) : "";
  const socialPeakLabel = socialPeakDate ? formatPeriodDate(periodLabel, socialPeakDate) : "";

  const line1 =
    `가장 뜨거운 법안은 ${LAW_LABEL[topVolume.name]}으로, 최근 ${periodLabel} 기사 ${topVolume.value.toLocaleString()}건(${topGrowth.growthRate >= 0 ? "+" : ""}${topGrowth.growthRate.toFixed(1)}%)이며 ` +
    `소셜/뉴스 비율 ${(ratio).toFixed(2)}로 ${driver} 양상을 보였습니다.`;

  const line2 =
    `뉴스 기준 언급량 최고 정점은 ${newsPeakLabel}에 기록되었으며, 총 ${newsCount.toLocaleString()}건의 보도가 있었습니다.` +
    `${newsTitle ? ` (대표 이슈 기사: “${newsTitle}”)` : ""}`;

  const line3 =
    `소셜 기준 언급량 최고 정점은 ${socialPeakLabel}에 기록되었으며, 총 ${socialCount.toLocaleString()}건의 언급이 있었습니다.` +
    `${socialTitle ? ` (대표 이슈 기사: “${socialTitle}”)` : ""}`;

  const topLawLabel = LAW_LABEL[topVolume.name];

  const summary =
    `${topLawLabel}은(는) 최근 가장 높은 주목도를 보인 법안으로, ` +
    `${topLawLean ? `소셜 여론은 '${topLawLean} 반응'이 우세하게 나타났습니다.` : `소셜 여론은 '뚜렷한 찬반 없이 다양한 반응'이 혼재되었습니다.`} ` +
    `본 대시보드는 뉴스·소셜 기반으로 언급량, 반응 패턴, 사건 맥락을 종합해 법안의 사회적 중요도를 평가하고, 시계열 추세를 통해 법률 제·개정 수요를 전망합니다.`;

  // console.log 는 필요 시에만 사용하세요.
  // console.log("Top Volume KPI:", topVolume);

  return (
    <div
      className={`${className ?? ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center mb-4 gap-2">
          <h3 className="text-2xl font-semibold">핵심 인사이트 ({periodLabel}별)</h3>
          <Image
            src="/icons/info.png"
            alt="도움말"
            width={24}
            height={24}
            title={`전체 법안과 전체 소셜의 (${periodLabel}별) 종합분석 핵심 인사이트입니다.`}
            className="object-contain cursor-pointer"
          />
        </div>
        <span className="text-xs text-neutral-600">기준: 최근 {periodLabel}</span>
      </div>

    <div className="h-full flex flex-col
                  bg-white/25 backdrop-blur-md rounded-2xl p-5 md:p-6
                  border border-white/40
                  shadow-[0_12px_40px_rgba(20,30,60,0.12)]
                  text-neutral-700">
      {/* 요약 3줄 */}
      <ul className="space-y-3 ">
        {[line1, line2, line3].map((line, idx) => (
          <li key={`insight-${idx}`} className="flex items-start gap-2">
            <span className="mt-[6px] w-2.5 h-2.5 shrink-0 rounded-full bg-sky-500/70" />
            <p className="text-sm md:text-base leading-relaxed">
              {line}
            </p>
          </li>
        ))}
      </ul>

      {/* 하이라이트 */}
      <div className="mt-5 rounded-xl bg-white/50 backdrop-blur p-3 border border-white/60">
        <p className="text-xs text-neutral-600">요약 키포인트</p>
        <p className="text-sm md:text-base font-semibold mt-1">
          {topLawLabel} · {driver} · 뉴스피크: {newsPeakLabel} · 소셜피크: {socialPeakLabel}
        </p>
        <p className="text-xs text-neutral-700 mt-1">{summary}</p>
      </div>
      </div>
    </div>
  );
}
