"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import LawDetailModal from "./LawDetailModal";
import { usePeriod } from "@/shared/contexts/PeriodContext";
import type { PeriodKey } from "@/shared/types/common";

const ENTER_DUR = 0.4;
const STAGGER = 0.25;
const HOLD_AFTER = 1.8;
const INTRO_ONLY_1 = 0.6;

// 아이콘
const PieIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm">
    <circle cx="24" cy="24" r="20" fill="#FFFBE9" />
    <path d="M24 4a20 20 0 0 1 20 20H24V4z" fill="#957C62" />
  </svg>
);
const BookIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm">
    <rect x="8" y="10" width="32" height="28" rx="4" fill="#FFFBE9" />
    <path d="M24 10v28" stroke="#957C62" strokeWidth="3" />
    <path d="M14 18h8M26 18h8M14 24h8M26 24h8" stroke="#fff" strokeWidth="2" />
  </svg>
);
const PillIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm">
    <rect x="10" y="14" width="28" height="20" rx="10" fill="#FFFBE9" />
    <path d="M14 24h16" stroke="#957C62" strokeWidth="10" strokeLinecap="round" />
    <circle cx="36" cy="14" r="4" fill="#FFDBB5" />
  </svg>
);

/** 보수적 타입가드 */
function isObj(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** 카테고리별 합계를 만드는 헬퍼 */
function computeCategoryTotals(allRoot: any, period: PeriodKey) {
  const socialTL = isObj(allRoot?.social) ? allRoot.social[period] : null;
  const tl = isObj(socialTL) ? socialTL : {};

  // 결과 누적: { [category]: { gj:개정강화, pj:폐지약화, bd:반대 } }
  const agg: Record<string, { gj: number; pj: number; bd: number }> = {};

  for (const key in tl) {
    if (!Object.prototype.hasOwnProperty.call(tl, key)) continue;
    const entry = tl[key];
    const topMap = isObj(entry) ? entry["대분류목록"] : null;
    if (!isObj(topMap)) continue;

    for (const category in topMap) {
      if (!Object.prototype.hasOwnProperty.call(topMap, category)) continue;
      const midMap = isObj(topMap[category]) ? topMap[category]["중분류목록"] : null;
      if (!isObj(midMap)) continue;

      if (!agg[category]) agg[category] = { gj: 0, pj: 0, bd: 0 };

      for (const mid in midMap) {
        if (!Object.prototype.hasOwnProperty.call(midMap, mid)) continue;
        const subMap = isObj(midMap[mid]) ? midMap[mid]["소분류목록"] : null;
        if (!isObj(subMap)) continue;

        for (const subKey in subMap) {
          if (!Object.prototype.hasOwnProperty.call(subMap, subKey)) continue;
          const s = subMap[subKey];

          const agreeObj = isObj(s?.["찬성"]) ? s["찬성"] : {};
          const gj = Number(agreeObj?.["개정강화"]?.count ?? 0); // 개정강화
          const pj = Number(agreeObj?.["폐지약화"]?.count ?? 0); // 데이터 키는 '폐지약화' 임

          const counts = isObj(s?.counts) ? s.counts : {};
          const bd = Number(counts?.["반대"] ?? 0); // 반대 총합

          agg[category].gj += gj;
          agg[category].pj += pj;
          agg[category].bd += bd;
        }
      }
    }
  }

  return agg;
}

/** 최신 키(가장 최근 날짜/주/월) 반환 */
function getLatestKey(tl: Record<string, any>) {
  const keys = Object.keys(tl ?? {}).sort();
  return keys.at(-1);
}

export default function LawRankingSection() {
  const { period } = usePeriod(); // 컨텍스트에서 기간
  const [allRoot, setAllRoot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ category: string; details: any } | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  // 데이터 패치: /public/data/dadata.json
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
        setAllRoot(isObj(json?.all) ? json.all : null);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "데이터 불러오기 실패");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period]);

  // 랭킹 계산 (카테고리 단위)
  const rankings = useMemo(() => {
    if (!isObj(allRoot)) {
      return { 개정강화: [], 폐지완화: [], 강한반대: [] } as Record<string, Array<{ category: string; total: number }>>;
    }
    const totals = computeCategoryTotals(allRoot, period);

    // 정렬 + 상위 N (원래 UI에 맞춰 4개 정도 노출)
    const topN = 4;
    const toList = (key: "gj" | "pj" | "bd") =>
      Object.entries(totals)
        .map(([category, v]) => ({ category, total: v[key] }))
        .filter((x) => x.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, topN);

    return {
      개정강화: toList("gj"),
      폐지완화: toList("pj"), // 데이터 키는 '폐지약화'였지만, UI 표기는 '폐지완화'
      강한반대: toList("bd"),
    } as const;
  }, [allRoot, period]);

  // 순환 애니메이션 타이머
  useEffect(() => {
    const total = INTRO_ONLY_1 + (3 * STAGGER + ENTER_DUR) + HOLD_AFTER;
    const id = setInterval(() => setCycleKey((k) => k + 1), total * 1000);
    return () => clearInterval(id);
  }, []);

  const cardMeta = {
    개정강화: { title: "'개정강화 필요'", Icon: PieIcon },
    폐지완화: { title: "'폐지완화 필요'", Icon: BookIcon },
    강한반대: { title: "'강한반대'", Icon: PillIcon },
  } as const;

  const rankBadge: Record<number, string> = {
    1: "bg-[#AD8B73] text-white",
    2: "bg-[#CEAB93] text-white",
    3: "bg-[#E3CAA5] text-[#FFFBE9]",
    4: "bg-[#FFFBE9] text-[#AD8B73]",
  };

  if (loading) {
    return (
      <section className="w-full">
        <div className="w-full max-w-4xl grid gap-3">
          <div className="h-24 rounded-xl border animate-pulse bg-neutral-50" />
          <div className="h-24 rounded-xl border animate-pulse bg-neutral-50" />
          <div className="h-24 rounded-xl border animate-pulse bg-neutral-50" />
        </div>
      </section>
    );
  }

  if (error) {
    return <section className="w-full text-red-600">랭킹 로딩 실패: {error}</section>;
  }

  return (
    <section className="w-full">
      <div className="text-center mb-8">
        <h1
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
          className="text-3xl md:text-4xl text-slate-800 tracking-tight"
        >
          입법 수요 랭킹
        </h1>
        <p className="mt-2 text-slate-500 text-sm">여론의 입법 수요를 확인할 수 있습니다.</p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(["개정강화", "폐지완화", "강한반대"] as const).map((type) => {
          const { title, Icon } = cardMeta[type];
          const list = (rankings as any)?.[type] as Array<{ category: string; total: number }>;

          return (
            <div key={type} className="hover:shadow-xl rounded-[24px] bg-white shadow-xl p-10 flex flex-col items-center text-center">
              <Icon />
              <h2 style={{ fontFamily: "'Black Han Sans', sans-serif" }} className="mt-4 text-lg text-slate-800">
                {title}
              </h2>
              <p className="text-xs text-slate-400">{type}</p>

              <div className="w-full mt-6 space-y-3">
                {list && list.length > 0 ? (
                  list.map((item, i) => {
                    const rank = i + 1;

                    // 상세 모달 데이터: 최신 키의 해당 카테고리 블록
                    const socialTL = allRoot?.social?.[period] ?? {};
                    const latestKey = getLatestKey(socialTL);
                    const detailData = isObj(socialTL?.[latestKey]?.["대분류목록"])
                      ? socialTL[latestKey]["대분류목록"]?.[item.category] ?? {}
                      : {};

                    return (
                      <motion.button
                        key={`${type}-${item.category}-${cycleKey}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: rank === 1 ? 0 : INTRO_ONLY_1 + (i - 1) * STAGGER,
                          duration: ENTER_DUR,
                          ease: "easeOut",
                        }}
                        onClick={() => setSelected({ category: item.category, details: detailData })}
                        className="w-full text-left"
                      >
                        <div
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-full
                                     bg-[#DFD3C3]/20 hover:bg-[#DFD3C3] hover:shadow-xl transition border border-[#DCC5B2]/10"
                        >
                          <div className={`w-7 h-7 grid place-items-center rounded-full text-xs font-bold ${rankBadge[rank]}`}>
                            {rank}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{item.category}</p>
                            <p className="text-[12px] text-slate-500">
                              총 반응 {item.total.toLocaleString()} ·{" "}
                              {type === "개정강화" ? "법 강화 요구" : type === "폐지완화" ? "규제 완화 요청" : "강한 반대 여론"}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="text-sm text-neutral-500">표시할 랭킹이 없습니다.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <LawDetailModal
          open={!!selected}
          category={selected.category}
          details={selected.details}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
