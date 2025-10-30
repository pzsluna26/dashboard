"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import LawDetailModal from "./LawDetailModal";
import { computeRankings } from "./utils/computeRankings";

interface Props {
  data: any;
  period: string;
}

const ENTER_DUR = 0.4;
const STAGGER = 0.25;
const HOLD_AFTER = 1.8;
const INTRO_ONLY_1 = 0.6;

// 아이콘
const PieIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm">
    <circle cx="24" cy="24" r="20" fill="#86efac" />
    <path d="M24 4a20 20 0 0 1 20 20H24V4z" fill="#22c55e" />
  </svg>
);
const BookIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm">
    <rect x="8" y="10" width="32" height="28" rx="4" fill="#86efac" />
    <path d="M24 10v28" stroke="#22c55e" strokeWidth="3" />
    <path d="M14 18h8M26 18h8M14 24h8M26 24h8" stroke="#fff" strokeWidth="2" />
  </svg>
);
const PillIcon = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="drop-shadow-sm">
    <rect x="10" y="14" width="28" height="20" rx="10" fill="#e2e8f0" />
    <path d="M14 24h16" stroke="#22c55e" strokeWidth="10" strokeLinecap="round" />
    <circle cx="36" cy="14" r="4" fill="#84cc16" />
  </svg>
);

export default function LawRankingSection({ data, period }: Props) {
  const [selected, setSelected] = useState<{ category: string; details: any } | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  const rankings = useMemo(() => computeRankings(data, period), [data, period]);

  useEffect(() => {
    const total = INTRO_ONLY_1 + (3 * STAGGER + ENTER_DUR) + HOLD_AFTER;
    const id = setInterval(() => setCycleKey((k) => k + 1), total * 1000);
    return () => clearInterval(id);
  }, []);

  const cardMeta = {
    개정강화: { title: "'개정강화 필요'", Icon: PieIcon, accent: "from-emerald-50 to-white" },
    폐지완화: { title: "'폐지완화 필요'", Icon: BookIcon, accent: "from-emerald-50 to-white" },
    강한반대: { title: "'강한반대'", Icon: PillIcon, accent: "from-emerald-50 to-white" },
  } as const;

  const rankBadge: Record<number, string> = {
    1: "bg-[#AD8B73] text-white",
    2: "bg-[#CEAB93] text-white",
    3: "bg-[#E3CAA5] text-[#FFFBE9]",
    4: "bg-[#FFFBE9] text-[#AD8B73]",
  };

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
          const { title, Icon, accent } = cardMeta[type];
          return (
            <div
              key={type}
              className={`hover:shadow-xl rounded-[24px] bg-white shadow-xl p-10 flex flex-col items-center text-center`}
            >
              <h2 style={{ fontFamily: "'Black Han Sans', sans-serif" }} className="mt-4 text-lg text-slate-800">
                {title}
              </h2>
              <p className="text-xs text-slate-400">{type}</p>

              <div className="w-full mt-6 space-y-3">
                {rankings[type].map((item, i) => {
                  const rank = i + 1;

                  const detailData = (() => {
  const timeline = data["all"]?.social?.[period] ?? {};
  const firstDate = Object.keys(timeline).sort().at(-1); // ✅ 최신 날짜
  return timeline?.[firstDate]?.["대분류목록"]?.[item.category] ?? {};
})();


                  return (
                    <motion.button
                      key={`${item.category}-${cycleKey}`}
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
                        <div
                          className={`w-7 h-7 grid place-items-center rounded-full text-xs font-bold ${rankBadge[rank]}`}
                        >
                          {rank}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">
                            {item.category}
                          </p>
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
                })}
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
