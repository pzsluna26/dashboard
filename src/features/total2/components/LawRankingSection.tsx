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
const StrengthenIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm" aria-hidden>
    <circle cx="24" cy="24" r="20" fill="#FFFBE9" />
    {/* gavel head */}
    <rect x="22" y="14" width="12" height="6" rx="1.5" fill="#957C62" />
    {/* gavel neck */}
    <rect x="19" y="17" width="6" height="3" rx="1.5" fill="#AD8B73" />
    {/* handle */}
    <rect x="10" y="26" width="18" height="3" rx="1.5" transform="rotate(-30 10 26)" fill="#957C62" />
    {/* strike base */}
    <rect x="26" y="28" width="12" height="3.5" rx="1.75" fill="#DCC5B2" />
    {/* sparkle */}
    <path d="M36 10l1.2 2.6L40 14l-2.8 1.2L36 18l-1.2-2.8L32 14l2.8-1.4L36 10z" fill="#E3CAA5" />
  </svg>
);

const RelaxIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm" aria-hidden>
    <circle cx="24" cy="24" r="20" fill="#FFFBE9" />
    {/* open lock */}
    <path d="M17 20v-3a7 7 0 0 1 14 0" fill="none" stroke="#957C62" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="14" y="20" width="20" height="14" rx="3" fill="#FFDBB5" stroke="#957C62" strokeWidth="2" />
    <circle cx="24" cy="27" r="2" fill="#957C62" />
    <rect x="23" y="29" width="2" height="3.5" rx="1" fill="#957C62" />
  </svg>
);

const OpposeIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm" aria-hidden>
    <circle cx="24" cy="24" r="20" fill="#FFFBE9" />
    <circle cx="24" cy="24" r="12" fill="#FFDBB5" stroke="#957C62" strokeWidth="2" />
    <path d="M18 30L30 18" stroke="#957C62" strokeWidth="3.5" strokeLinecap="round" />
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

  // 카드별 그라데이션 테두리 색
  const borderWrap: Record<"개정강화" | "폐지완화" | "강한반대", string> = {
    개정강화: "from-[#AD8B73] via-[#DCC5B2] to-[#E3CAA5]",
    폐지완화: "from-[#CEAB93] via-[#E3CAA5] to-[#FFFBE9]",
    강한반대: "from-[#E6A6A6] via-[#F1C6B6] to-[#FFEDE0]",
  };

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
    return () => {
      mounted = false;
    };
  }, [period]);

  // 랭킹 계산 (카테고리 단위)
  const rankings = useMemo(() => {
    if (!isObj(allRoot)) {
      return { 개정강화: [], 폐지완화: [], 강한반대: [] } as Record<
        string,
        Array<{ category: string; total: number }>
      >;
    }
    const totals = computeCategoryTotals(allRoot, period);

    // 정렬 + 상위 N
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

  // 카드 메타 (아이콘만 교체)
  const cardMeta = {
    개정강화: { title: "'개정강화 필요'", Icon: StrengthenIcon },
    폐지완화: { title: "'폐지완화 필요'", Icon: RelaxIcon },
    강한반대: { title: "'강한반대'", Icon: OpposeIcon },
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
            <div
              key={type}
              className={`p-[1.5px] rounded-[24px] bg-gradient-to-br ${borderWrap[type]}
                          shadow-[0_0_0_1px_rgba(255,255,255,0.6)_inset] hover:shadow-2xl transition`}
            >
              <div
                className="rounded-[23px] bg-white/95 backdrop-blur-[1px]
                           shadow-xl p-10 flex flex-col items-center text-center
                           ring-1 ring-black/5 hover:ring-black/10
                           transition-colors duration-200"
              >
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
                          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AD8B73]/40 rounded-full"
                        >
                          <div
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-full
                                       bg-[#DFD3C3]/20 hover:bg-[#DFD3C3]
                                       border border-[#DCC5B2]/20 hover:border-[#DCC5B2]/40
                                       shadow-sm hover:shadow-xl transition"
                          >
                            <div
                              className={`w-7 h-7 grid place-items-center rounded-full text-xs font-bold ${rankBadge[rank]}`}
                            >
                              {rank}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">{item.category}</p>
                              <p className="text-[12px] text-slate-500">
                                총 반응 {item.total.toLocaleString()} ·{" "}
                                {type === "개정강화"
                                  ? "법 강화 요구"
                                  : type === "폐지완화"
                                  ? "규제 완화 요청"
                                  : "강한 반대 여론"}
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
