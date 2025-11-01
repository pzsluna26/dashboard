"use client";
import React, { useMemo } from "react";

interface ArticleItem {
  title: string;
  url: string;
  date: string; // YYYY-MM-DD
  comments: number; // social comments
  legal: string; // 관련법
  category: string; // privacy/child/...
  mid: string; // 중분류
  subKey: string; // 소분류 키 (mid_sub)
}

export interface RisingHotNewsProps {
  data: any; // /data/data.json
  maxItems?: number; // default 5
  days?: number; // 최근 N일, default 7
  moreHref?: string; // 더보기 링크, default "/news"
  startDate?: string; // 선택 기간 시작 (YYYY-MM-DD)
  endDate?: string;   // 선택 기간 끝 (YYYY-MM-DD)
}

// 특정 기준일(anchor)로부터 최근 N일
function lastNDatesFrom(anchor: Date, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out.reverse();
}

// 데이터 내에서 사용 가능한 최신 날짜(YYYY-MM-DD) 찾기
function findLatestNewsDate(raw: any): string | null {
  const cats = Object.keys(raw || {});
  let latest: string | null = null;
  for (const c of cats) {
    const daily = raw[c]?.news?.["daily_timeline"] || {};
    for (const k of Object.keys(daily)) {
      if (!latest || k > latest) latest = k; // YYYY-MM-DD 문자열 비교 가능
    }
  }
  return latest;
}

// 기간 범위에서 날짜 리스트 생성
function datesBetween(start?: string, end?: string): string[] {
  if (!start || !end) return [];
  const s = new Date(start);
  const e = new Date(end);
  const out: string[] = [];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d).toISOString().slice(0, 10));
  }
  return out;
}

export default function RisingHotNews({ data, maxItems = 5, days = 7, moreHref = "/news", startDate, endDate }: RisingHotNewsProps) {
  const items = useMemo<ArticleItem[]>(() => {
    if (!data) return [];

    // 1) 기간 소스 결정: start/end 우선, 없으면 데이터 내 최신일자 기준 최근 N일
    let dateList: string[] = [];
    if (startDate && endDate) {
      dateList = datesBetween(startDate, endDate);
    } else {
      const latest = findLatestNewsDate(data);
      if (!latest) return [];
      dateList = lastNDatesFrom(new Date(latest), days);
    }

    const categories = Object.keys(data || {});
    const acc: ArticleItem[] = [];

    for (const cat of categories) {
      const newsDaily = data[cat]?.news?.["daily_timeline"] || {};
      const addDaily = data[cat]?.addsocial?.["daily_timeline"] || {};

      for (const dateStr of dateList) {
        const newsEntry = newsDaily[dateStr];
        if (!newsEntry) continue;
        const mids = newsEntry?.["중분류목록"] || {};
        for (const mid of Object.keys(mids)) {
          const subs = mids[mid]?.["소분류목록"] || {};
          for (const subFullKey of Object.keys(subs)) {
            const sub = subs[subFullKey];
            const legal = sub?.["관련법"] || mid;
            const articles = sub?.articles || [];

            const addEntry = addDaily[dateStr] || {};
            const addSubs = addEntry?.["중분류목록"]?.[mid]?.["소분류목록"] || {};
            const addSub = addSubs[subFullKey] || {};
            const agree = addSub?.["찬성"]?.["개정강화"]?.count || 0;
            const repeal = addSub?.["찬성"]?.["폐지약화"]?.count || 0;
            const disagree = addSub?.["반대"]?.count || 0;
            const comments = agree + repeal + disagree;

            for (const art of articles) {
              acc.push({
                title: art.title,
                url: art.url,
                date: dateStr,
                comments,
                legal,
                category: cat,
                mid,
                subKey: subFullKey,
              });
            }
          }
        }
      }
    }

    // Social_Comment 기준 내림차순, 동일하면 최신 날짜 우선
    acc.sort((a, b) => {
      if (b.comments !== a.comments) return b.comments - a.comments;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });

    return acc.slice(0, maxItems);
  }, [data, maxItems, days, startDate, endDate]);

  if (!items.length) {
    return (
      <div className="w-full h-full grid place-items-center text-sm text-neutral-500">
        표시할 뉴스가 없습니다. 기간을 변경해 보세요.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <ul className="flex-1 min-h-0 divide-y divide-neutral-200/70 overflow-auto pr-1">
        {items.map((it, idx) => (
          <li key={`${it.url}-${idx}`} className="py-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 rounded bg-neutral-100 text-[11px] grid place-items-center text-neutral-600 border border-neutral-200">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <a href={it.url} target="_blank" rel="noreferrer noopener" className="font-medium text-sm text-[#1f2937] hover:underline line-clamp-1">
                    {it.title}
                  </a>
                  <span className="text-[11px] text-neutral-500 whitespace-nowrap">{it.date}</span>
                </div>
                <div className="mt-1 text-[12px] text-neutral-500 line-clamp-1">
                  관련법: <span className="text-neutral-700 font-medium">{it.legal}</span>
                  <span className="mx-2">·</span>
                  댓글 <b className="text-neutral-800">{it.comments.toLocaleString()}</b>
                </div>
              </div>
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0 text-xs px-2 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-50"
              >
                원문보기
              </a>
            </div>
          </li>
        ))}
      </ul>

      <div className="pt-2 flex justify-end">
        <button
          onClick={() => { if (moreHref) window.open(moreHref, "_blank"); }}
          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50"
        >
          더보기
        </button>
      </div>
    </div>
  );
}
