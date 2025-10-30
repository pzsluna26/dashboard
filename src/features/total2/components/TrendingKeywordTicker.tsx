"use client";

import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { PeriodKey, PeriodLabel } from "@/shared/types/common";
import { usePeriod } from "@/shared/contexts/PeriodContext";

import ArticleCard from "./ArticleCard";
import SocialReactionChart from "./SocialReactionChart";

type SocialStats = {
  agree: number;
  disagree: number;
  강화: number; // 개정강화
  완화: number; // 폐지약화
};

type SubPick = {
  subKey: string;                // `${mid}_${소분류}`
  mid: string;                   // ex) 개인정보보호법
  label: string;                 // 소분류명
  totalCount: number;            // 뉴스 기준 합계
  newsArticle?: { title: string; url: string; content: string };
  socialStats?: SocialStats;
  relatedLaw?: { text?: string; url?: string };
};

const PERIOD_LABELS: Record<PeriodKey, PeriodLabel> = {
  daily_timeline: "일",
  weekly_timeline: "주",
  monthly_timeline: "월",
};

function getTimeline(all: any, domain: "news" | "social", period: PeriodKey) {
  return all?.[domain]?.[period] ?? {};
}

function safeRelatedLaw(raw: any): { text?: string; url?: string } | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return { text: raw };
  if (typeof raw === "object") {
    return { text: raw.내용 ?? raw.text ?? "", url: raw.url };
  }
  return undefined;
}

function aggregateTopSubsFromNews(all: any, period: PeriodKey): {
  topMid: string | null;
  topSubs: SubPick[];
} {
  const newsTL = getTimeline(all, "news", period);
  const midTotals = new Map<string, number>();
  const subTotalsByMid = new Map<string, Map<string, { count: number; sampleArticle?: any; relatedLaw?: any }>>();

  for (const entry of Object.values<any>(newsTL ?? {})) {
    const topMap = entry?.["대분류목록"] ?? {};
    for (const cat of Object.keys(topMap ?? {})) {
      const midMap = topMap[cat]?.["중분류목록"] ?? {};
      for (const mid of Object.keys(midMap ?? {})) {
        const midCount = Number(midMap[mid]?.count ?? 0);
        midTotals.set(mid, (midTotals.get(mid) ?? 0) + midCount);

        const subs = midMap[mid]?.["소분류목록"] ?? {};
        let subBucket = subTotalsByMid.get(mid);
        if (!subBucket) {
          subBucket = new Map();
          subTotalsByMid.set(mid, subBucket);
        }
        for (const subKey of Object.keys(subs ?? {})) {
          const subObj = subs[subKey] ?? {};
          const add = Number(subObj?.count ?? 0);
          const prev = subBucket.get(subKey)?.count ?? 0;

          const sampleArticle =
            subBucket.get(subKey)?.sampleArticle ??
            (Array.isArray(subObj?.articles) ? subObj.articles[0] : undefined);

          const relatedLaw = subBucket.get(subKey)?.relatedLaw ?? subObj?.["관련법"];

          subBucket.set(subKey, {
            count: prev + add,
            sampleArticle,
            relatedLaw,
          });
        }
      }
    }
  }

  if (!midTotals.size) return { topMid: null, topSubs: [] };
  const topMid = Array.from(midTotals.entries()).sort((a, b) => b[1] - a[1])[0][0];

  const subBucket = subTotalsByMid.get(topMid) ?? new Map();
  const topSubsRaw = Array.from(subBucket.entries())
    .sort((a, b) => (b[1].count ?? 0) - (a[1].count ?? 0))
    .slice(0, 5);

  const topSubs: SubPick[] = topSubsRaw.map(([subKey, obj]) => {
    const [, label = subKey] = subKey.split(`${topMid}_`);
    return {
      subKey,
      mid: topMid,
      label,
      totalCount: obj.count ?? 0,
      newsArticle: obj.sampleArticle
        ? { title: obj.sampleArticle.title, url: obj.sampleArticle.url, content: obj.sampleArticle.content }
        : undefined,
      relatedLaw: safeRelatedLaw(obj.relatedLaw),
    };
  });

  return { topMid, topSubs };
}

function aggregateSocialForSub(all: any, period: PeriodKey, mid: string, subLabel: string): SocialStats | undefined {
  const socialTL = getTimeline(all, "social", period);
  const subKey = `${mid}_${subLabel}`;

  let agree = 0, disagree = 0, 강화 = 0, 완화 = 0;

  for (const entry of Object.values<any>(socialTL ?? {})) {
    const topMap = entry?.["대분류목록"] ?? {};
    for (const cat of Object.keys(topMap ?? {})) {
      const midMap = topMap[cat]?.["중분류목록"] ?? {};
      const subs = midMap[mid]?.["소분류목록"] ?? {};
      const subObj = subs[subKey];
      if (!subObj) continue;

      const counts = subObj?.counts ?? {};
      agree += Number(counts?.["찬성"] ?? 0);
      disagree += Number(counts?.["반대"] ?? 0);

      const agreeObj = subObj?.["찬성"] ?? {};
      강화 += Number(agreeObj?.["개정강화"]?.count ?? 0);
      완화 += Number(agreeObj?.["폐지약화"]?.count ?? 0);
    }
  }

  if (agree + disagree + 강화 + 완화 === 0) return undefined;
  return { agree, disagree, 강화, 완화 };
}

export default function TrendingKeywordTicker() {
  const { period, setPeriod } = usePeriod();

  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [subs, setSubs] = useState<SubPick[]>([]);

  // 섹션 자율 패치
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/data/dadata.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setRaw(json?.all ?? null);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "데이터 불러오기 실패");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period]);

  // 상위 mid → 소분류5 + 소셜/관련법 매핑
  useEffect(() => {
    if (!raw) return;

    const { topMid, topSubs } = aggregateTopSubsFromNews(raw, period);
    if (!topMid || topSubs.length === 0) {
      setSubs([]);
      setIndex(0);
      return;
    }

    const enriched = topSubs.map((s) => ({
      ...s,
      socialStats: aggregateSocialForSub(raw, period, s.mid, s.label),
    }));

    setSubs(enriched);
    setIndex(0);
  }, [raw, period]);

  // 3초 순환
  useEffect(() => {
    if (!subs.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % subs.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [subs]);

  const current = subs[index];

  if (loading) {
    return (
      <div className="w-full h-[280px] grid place-items-center text-neutral-600">
        트렌드 데이터를 불러오는 중…
      </div>
    );
  }

  if (error || !subs.length) {
    return (
      <div className="w-full h-[280px] grid place-items-center text-red-600">
        {error ?? "표시할 데이터가 없습니다."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* 제목 */}
      <div className="text-center">
        <h2
          className="text-4xl text-gray-900 tracking-tight"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        >
          이슈와 언론 및 여론 동향
        </h2>
        <p className="text-neutral-500 mt-2 text-sm">종합 데이터를 기반으로 요약된 정보를 제공합니다.</p>
      </div>

      {/* 검색창 + 기간 선택 */}
      <div className="relative flex items-center justify-center w-full px-7 md:px-12">
        <div className="flex items-center gap-5 border border-[#55AD9B] bg-white shadow rounded-2xl px-10 py-3 w-[600px] mx-auto">
          <FaSearch className="text-gray-600" />
          <div className="flex items-center gap-3 text-gray-700 sm:text-lg truncate">
            <span
              style={{
                backgroundColor: "#95D2B3",
                color: "white",
                fontWeight: "bold",
                borderRadius: "6px",
                padding: "2px 8px",
                minWidth: "32px",
                textAlign: "center",
              }}
            >
              {index + 1}
            </span>
            <p style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
              {current?.label ?? "키워드 없음"}
            </p>
          </div>
        </div>

        <div className="absolute right-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}간
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 카드 섹션 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1) 기사 카드: news articles[0] */}
        <ArticleCard
          articleTitle={current?.newsArticle?.title}
          articleUrl={current?.newsArticle?.url}
          summary={current?.newsArticle?.content}
        />

        {/* 2) 여론 카드: social counts + 찬성(개정강화/폐지약화) */}
        <div className="w-full h-[250px]">
          <div className="bg-white shadow-md border border-gray-200 p-6 h-full flex flex-col justify-between hover:shadow-xl">
            <div className="flex-1">
              <h3 className="flex items-center gap-2 text-neutral-700 font-bold text-lg mb-3">
                <img src="/icons/msg.png" className="w-6 h-6 object-contain" />
                여론반응
              </h3>
              {current?.socialStats ? (
                <SocialReactionChart
                  agree={current.socialStats.agree}
                  disagree={current.socialStats.disagree}
                  강화={current.socialStats.강화}
                  완화={current.socialStats.완화}
                />
              ) : (
                <div className="text-gray-400 text-sm flex justify-center items-center h-full">
                  데이터 없음
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3) 관련법 카드 (언급량 그래프 제거) */}
        <div className="w-full h-[250px]">
          <div className="bg-white shadow-md border border-gray-200 p-6 h-full flex flex-col justify-between hover:shadow-xl">
            <div>
              <h3 className="flex items-center gap-2 text-neutral-700 font-bold text-lg mb-3">
                <img src="/icons/law.png" className="w-6 h-6 object-contain" />
                관련법
              </h3>
              {current?.relatedLaw?.text ? (
                <div className="text-sm text-neutral-700">
                  <div className="line-clamp-3">{current.relatedLaw.text}</div>
                  {current.relatedLaw.url ? (
                    <a
                      href={current.relatedLaw.url}
                      className="inline-block mt-2 text-xs text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      법령 상세 보기
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="text-neutral-400 text-sm">관련법 정보 없음</div>
              )}
            </div>

            {/* 하단 메타(선택된 소분류 표시) */}
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
              <span className="truncate">소분류: {current?.label ?? "-"}</span>
              <span className="shrink-0">뉴스 합계: {current?.totalCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
