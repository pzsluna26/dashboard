"use client";
import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";

/**
 * R2 법조항 TOP5 컴포넌트
 * - 소분류 단위 addsocial.daily_timeline를 기간으로 필터링 → 관련법(법조항) 기준 그룹핑/합산
 * - 입장 분포(개정강화/폐지완화/반대) 진행바
 * - 관련 뉴스 수: news.daily_timeline의 같은 기간 내 동일 관련법의 articles 길이 합
 * - 사건(Incident) 수: 같은 기간 내 해당 법조항에 매핑된 소분류 항목 수(고유 key 기준)
 * - 주요 사건 2개: 댓글 수 상위 소분류 2개(대표뉴스/키)를 노출
 */

export type DomainKey = "privacy" | "child" | "safety" | "finance";
export type PeriodKey = "daily_timeline" | "weekly_timeline" | "monthly_timeline"; // (참고용)

export interface LegalArticleTop5Props {
  data: any;                 // /data/data.json 전체
  startDate?: string;        // "YYYY-MM-DD"
  endDate?: string;          // "YYYY-MM-DD"
  domains?: DomainKey[];     // 지정 없으면 모든 도메인 합산
  onClickDetail?: (legal: string) => void; // 상세보기 라우팅 핸들러
}

function parseDate(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, (m || 1) - 1, dd || 1);
}
function inRange(key: string, start?: string, end?: string) {
  if (!start && !end) return true;
  // 일별 키만 필터(YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return true;
  const d = parseDate(key).getTime();
  const s = start ? parseDate(start).getTime() : -Infinity;
  const e = end ? parseDate(end).getTime() : Infinity;
  return d >= s && d <= e;
}

export default function LegalArticleTop5({ data, startDate, endDate, domains, onClickDetail }: LegalArticleTop5Props) {
  const items = useMemo(() => {
    if (!data) return [] as any[];
    const pickDomains: DomainKey[] = domains && domains.length ? (domains as DomainKey[]) : ["privacy","child","safety","finance"];

    type Stance = { 강화: number; 완화: number; 반대: number };
    type Agg = {
      law: string;
      total: number;
      stance: Stance;
      newsCount: number;
      incidents: Record<string, { count: number; 대표뉴스?: string }>;
    };
    const agg = new Map<string, Agg>();

    // 1) addsocial.daily_timeline → 댓글·입장·사건 집계
    for (const dom of pickDomains) {
      const dl = data?.[dom]?.addsocial?.["daily_timeline"] || {};
      for (const [dateKey, entry] of Object.entries<any>(dl)) {
        if (!inRange(dateKey, startDate, endDate)) continue;
        const mids = entry?.중분류목록 || {};
        for (const [mid, midBucket] of Object.entries<any>(mids)) {
          const subs = (midBucket as any)?.소분류목록 || {};
          for (const [subKey, sub] of Object.entries<any>(subs)) {
            const law = sub?.관련법 || "(관련법 미상)";
            const counts = sub?.counts || { 찬성: 0, 반대: 0 };
            const agreeBlock = sub?.찬성 || { "개정강화": { count: 0 }, "폐지약화": { count: 0 } };
            const 강화 = agreeBlock?.["개정강화"]?.count || 0;
            const 완화 = agreeBlock?.["폐지약화"]?.count || 0;
            const 반대 = sub?.반대?.소셜목록 ? sub.반대.소셜목록.length : (counts?.반대 || 0);
            const total = (counts?.찬성 || 0) + (counts?.반대 || 0);

            if (!agg.has(law)) {
              agg.set(law, { law, total: 0, stance: { 강화: 0, 완화: 0, 반대: 0 }, newsCount: 0, incidents: {} });
            }
            const a = agg.get(law)!;
            a.total += total;
            a.stance.강화 += 강화;
            a.stance.완화 += 완화;
            a.stance.반대 += 반대;

            // Incident는 소분류 키를 식별자로 사용
            const id = `${mid}::${subKey}`;
            if (!a.incidents[id]) a.incidents[id] = { count: 0, 대표뉴스: sub?.대표뉴스 };
            a.incidents[id].count += total;
          }
        }
      }
    }

    // 2) news.daily_timeline → 관련 뉴스 수 집계(기간 동일)
    for (const dom of pickDomains) {
      const dl = data?.[dom]?.news?.["daily_timeline"] || {};
      for (const [dateKey, entry] of Object.entries<any>(dl)) {
        if (!inRange(dateKey, startDate, endDate)) continue;
        const mids = entry?.중분류목록 || {};
        for (const [, midBucket] of Object.entries<any>(mids)) {
          const subs = (midBucket as any)?.소분류목록 || {};
          for (const [, sub] of Object.entries<any>(subs)) {
            const law = sub?.관련법 || "(관련법 미상)";
            const n = Array.isArray(sub?.articles) ? sub.articles.length : 0;
            if (!agg.has(law)) {
              agg.set(law, { law, total: 0, stance: { 강화: 0, 완화: 0, 반대: 0 }, newsCount: 0, incidents: {} });
            }
            agg.get(law)!.newsCount += n;
          }
        }
      }
    }

    // 3) 배열로 변환 → 정렬 → TOP5
    const arr = Array.from(agg.values()).sort((a,b)=> b.total - a.total).slice(0,5).map((a) => {
      const incs = Object.entries(a.incidents).map(([k,v])=> ({ id:k, ...v })).sort((x,y)=> y.count - x.count);
      return {
        law: a.law,
        total: a.total,
        newsCount: a.newsCount,
        incidentCount: Object.keys(a.incidents).length,
        stance: a.stance,
        topIncidents: incs.slice(0,2),
      };
    });

    return arr;
  }, [data, startDate, endDate, domains]);

  if (!items.length) {
    return (
      <div className="h-full rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
        <div className="text-sm text-neutral-500 font-medium">입법수요 랭킹</div>
        <div className="mt-3 text-sm text-neutral-500">선택한 기간에 해당하는 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500 font-medium">입법수요 랭킹 (TOP5)</div>
      </div>
      <ol className="mt-4 space-y-4">
        {items.map((it, idx) => {
          const sum = Math.max(1, it.stance.강화 + it.stance.완화 + it.stance.반대);
          const p강화 = Math.round((it.stance.강화 / sum) * 100);
          const p완화 = Math.round((it.stance.완화 / sum) * 100);
          const p반대 = 100 - p강화 - p완화;
          return (
            <li key={it.law} className="p-3 rounded-xl border bg-white/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-neutral-400">#{idx+1}</div>
                  <div className="text-base font-semibold text-neutral-900">{it.law}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500">총 댓글</div>
                  <div className="text-lg font-bold tabular-nums">{it.total.toLocaleString()}</div>
                </div>
              </div>

              {/* 입장 분포 진행바 */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>입장 분포</span>
                  <span className="tabular-nums">강화 {p강화}% · 완화 {p완화}% · 반대 {p반대}%</span>
                </div>
                <div className="mt-1 h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${p강화}%` }} />
                  <div className="h-full bg-blue-500 -mt-3" style={{ width: `${p완화}%` }} />
                  <div className="h-full bg-gray-400 -mt-3" style={{ width: `${p반대}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">(개정강화=빨강 · 폐지완화=파랑 · 반대=회색)</div>
              </div>

              {/* 부가 지표 */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-neutral-700">
                <div className="rounded-lg bg-neutral-50 p-2 border">
                  <div className="text-neutral-500">관련 뉴스</div>
                  <div className="font-semibold tabular-nums">{it.newsCount.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-neutral-50 p-2 border">
                  <div className="text-neutral-500">사건 수</div>
                  <div className="font-semibold tabular-nums">{it.incidentCount.toLocaleString()}</div>
                </div>
                <button
                  onClick={() => onClickDetail?.(it.law)}
                  className="rounded-lg bg-white hover:bg-neutral-50 transition-colors p-2 border flex items-center justify-center gap-1"
                >
                  상세보기 <ChevronRight className="w-4 h-4"/>
                </button>
              </div>

              {/* 주요 사건 2개 */}
              {it.topIncidents.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-neutral-500">주요 사건</div>
                  <ul className="mt-1 space-y-1">
                    {it.topIncidents.map((inc) => (
                      <li key={inc.id} className="flex items-center justify-between text-sm">
                        <div className="truncate pr-2">
                          <span className="text-neutral-800">{inc.id.replace("::"," · ")}</span>
                          {inc.대표뉴스 && <span className="ml-1 text-neutral-500">— {inc.대표뉴스}</span>}
                        </div>
                        <span className="tabular-nums text-neutral-700">{inc.count.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
