"use client";

import { LAW_LABEL } from "@/shared/constants/labels";
import { formatPeriodDate } from "@/shared/utils/period";
import { getSocialValue } from "@/shared/utils/computeKpis";
import type { KpiItem, Sentiment } from "@/shared/types/common";

/** -------- Types (기존과 호환) -------- */
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

/** -------- Small UI helpers -------- */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
    {children}
  </span>
);

const DotNumber = ({ n }: { n: number }) => (
  <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
    {n}
  </span>
);

const SoftCard = ({
  className = "",
  children,
}: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={
      "rounded-3xl border border-emerald-100/70 bg-white shadow-[0_6px_24px_rgba(16,185,129,0.06)] " +
      className
    }
  >
    {children}
  </div>
);

/** 하이라이트(이미지의 노란 형광펜 느낌) */
const Mark = ({ children }: { children: React.ReactNode }) => (
  <mark className="px-1 rounded-[4px] bg-amber-200/70 text-inherit underline decoration-amber-400/80 underline-offset-2">
    {children}
  </mark>
);

/** 퍼센트 바 */
const Bar = ({
  value, // 0~100
  left = "",
  right = "",
}: {
  value: number;
  left?: string;
  right?: string;
}) => (
  <div>
    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
      <span>{left}</span>
      <span>{right}</span>
    </div>
    <div className="h-2.5 w-full bg-neutral-200/70 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

/** -------- Math helpers -------- */
const clampPct = (num: number, den: number) =>
  Math.max(0, Math.min(100, (num / Math.max(1, den)) * 100));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]) => {
  if (xs.length <= 1) return 0;
  const m = avg(xs);
  return Math.sqrt(avg(xs.map((x) => (x - m) ** 2)));
};

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

  /** ── 1) 핵심 집계 ───────────────────────────────────── */
  const totalVolume = data.reduce((s, d) => s + (d.value || 0), 0);

  const enriched = data.map((d) => {
    const socialVal = getSocialValue(d.rawSocial);
    const amp = socialVal / Math.max(1, d.value);
    const agree = d.rawSocial?.["찬성"] ?? 0;
    const disagree = d.rawSocial?.["반대"] ?? 0;
    const polTotal = agree + disagree;
    const polarity = polTotal ? Math.abs(agree - disagree) / polTotal : 0; // 0~1
    return { ...d, socialVal, amp, agree, disagree, polarity };
  });

  const topVolume = [...enriched].sort((a, b) => b.value - a.value)[0];
  const topGrowth = [...enriched].sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0))[0];
  const topAmplify = [...enriched].sort((a, b) => b.amp - a.amp)[0];
  const topPolarized = [...enriched].sort((a, b) => b.polarity - a.polarity)[0];

  const lawLabel = (name: string) => LAW_LABEL[name] ?? name;
  const share = clampPct(topVolume.value, totalVolume);
  const agreePct = clampPct(topVolume.agree, topVolume.agree + topVolume.disagree);
  const lean: Sentiment | "찬반 혼재" = topVolume.agree > topVolume.disagree ? "찬성"
    : topVolume.disagree > topVolume.agree ? "반대"
    : "찬반 혼재";

  const driver =
    topAmplify.amp >= 0.9 ? "소셜 주도"
      : topAmplify.amp >= 0.6 ? "소셜 우세"
        : topAmplify.amp >= 0.4 ? "혼합"
          : topAmplify.amp > 0 ? "언론 우세"
            : "언론 주도";

  /** ── 2) 피크/대표 기사 ─────────────────────────────── */
  const dateMap: Record<
    string,
    { news: number; social: number; maxNews: number; maxSocial: number; newsDetail?: TrendPoint["detail"]; socialDetail?: TrendPoint["detail"] }
  > = {};
  for (const s of trend ?? []) {
    for (const p of s.data ?? []) {
      if (!dateMap[p.date]) dateMap[p.date] = { news: 0, social: 0, maxNews: 0, maxSocial: 0 };
      const cell = dateMap[p.date];
      cell.news += p.news || 0;
      cell.social += p.social || 0;
      if ((p.news || 0) > cell.maxNews && p.detail) {
        cell.maxNews = p.news || 0;
        cell.newsDetail = p.detail;
      }
      if ((p.social || 0) > cell.maxSocial && p.detail) {
        cell.maxSocial = p.social || 0;
        cell.socialDetail = p.detail;
      }
    }
  }
  let newsPeak = { date: "", count: 0, detail: undefined as TrendPoint["detail"] | undefined };
  let socialPeak = { date: "", count: 0, detail: undefined as TrendPoint["detail"] | undefined };
  Object.entries(dateMap).forEach(([d, v]) => {
    if (v.news > newsPeak.count) newsPeak = { date: d, count: v.news, detail: v.newsDetail };
    if (v.social > socialPeak.count) socialPeak = { date: d, count: v.social, detail: v.socialDetail };
  });
  const newsPeakLabel = newsPeak.date ? formatPeriodDate(periodLabel, newsPeak.date) : "-";
  const socialPeakLabel = socialPeak.date ? formatPeriodDate(periodLabel, socialPeak.date) : "-";
  const newsTitle = newsPeak.detail?.article?.title || [newsPeak.detail?.mid, newsPeak.detail?.sub].filter(Boolean).join(" - ");
  const socialTitle = socialPeak.detail?.article?.title || [socialPeak.detail?.mid, socialPeak.detail?.sub].filter(Boolean).join(" - ");

  /** ── 3) 변동성/모멘텀/리스크 ───────────────────────── */
  const seriesOf = (name: string) => trend?.find((t) => t.name === name)?.data ?? [];
  const totals = seriesOf(topVolume.name).map((p) => (p.news || 0) + (p.social || 0));
  const volatility = (avg(totals) ? (std(totals) / Math.max(1, avg(totals))) : 0) * 100;
  const momentum = (() => {
    const arr = totals;
    const last3 = arr.slice(-3), prev3 = arr.slice(-6, -3);
    return avg(last3) - avg(prev3);
  })();

  const maxV = Math.max(...enriched.map((d) => d.value), 1);
  const maxG = Math.max(...enriched.map((d) => d.growthRate || 0), 1);
  const maxA = Math.max(...enriched.map((d) => d.amp || 0), 1);
  const risk = Math.round(
    (topVolume.value / maxV) * 30 +
    ((topGrowth.growthRate || 0) / Math.max(1, maxG)) * 25 +
    ((topAmplify.amp || 0) / Math.max(1, maxA)) * 25 +
    (topPolarized.polarity || 0) * 20
  );

  /** ── 4) UI (이미지와 유사한 톤 & 레이아웃) ─────────── */
  return (
    <section
      className={
        "rounded-[28px] px-6 md:px-10 py-10 md:py-12 bg-[#F6FBF6] border border-emerald-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] " +
        (className || "")
      }
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-emerald-600">종합 인사이트</h2>
        <div className="hidden md:flex gap-2">
          <Pill>{periodLabel}</Pill>
          <Pill>AI 요약</Pill>
        </div>
      </div>

      {/* 상단 요약 영역 (이미지의 상단 카드 느낌) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* 좌측: 핵심 타이틀/칩 */}
        <SoftCard className="p-6 lg:col-span-1">
          <p className="text-[12px] text-neutral-500 mb-1">가장 주목받은 법안</p>
          <p className="text-xl font-extrabold text-emerald-700">{lawLabel(topVolume.name)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>지분 {share.toFixed(1)}%</Pill>
            <Pill>성장 +{(topGrowth.growthRate || 0).toFixed(1)}%</Pill>
            <Pill>{driver}</Pill>
            <Pill>여론 {lean}</Pill>
            <Pill>리스크 {risk}/100</Pill>
          </div>
        </SoftCard>

        {/* 중앙: 요약 문구 */}
        <SoftCard className="p-6 lg:col-span-2">
          <blockquote className="text-[15px] leading-relaxed text-neutral-700">
            <span className="text-neutral-400 mr-2">“</span>
            <b className="text-emerald-700">{lawLabel(topVolume.name)}</b>은(는) {periodLabel}에
            가장 높은 관심을 받았고, <Mark>{driver}</Mark> 성격이 뚜렷합니다. 여론은{" "}
            <b className="text-emerald-700">{lean}</b> 경향. 변동성{" "}
            <b>{volatility.toFixed(1)}%</b>, 모멘텀 <b>{Math.round(momentum)}</b>입니다.
            <span className="text-neutral-400 ml-1">”</span>
          </blockquote>
        </SoftCard>
      </div>

      {/* Needs / Goal 카드처럼: 왼쪽(핵심 신호) / 오른쪽(추천 액션) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 핵심 신호 */}
        <SoftCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xl font-extrabold text-neutral-800">핵심 신호</h3>
          </div>
          <ul className="space-y-4 text-[15px] text-neutral-800">
            <li className="flex gap-3">
              <DotNumber n={1} />
              <div>
                <b className="text-neutral-900">언급 지분</b>이{" "}
                <Mark>{share.toFixed(1)}%</Mark>로 동기간 최상위입니다.
                <div className="mt-2"><Bar value={share} left="0%" right="100%" /></div>
              </div>
            </li>
            <li className="flex gap-3">
              <DotNumber n={2} />
              <div>
                <b>성장</b>은 <Mark>+{(topGrowth.growthRate || 0).toFixed(1)}%</Mark>로 가속 구간입니다.
              </div>
            </li>
            <li className="flex gap-3">
              <DotNumber n={3} />
              <div>
                <b>증폭(소셜/뉴스)</b> 비율 <Mark>{topAmplify.amp.toFixed(2)}</Mark> → {driver}.
              </div>
            </li>
            <li className="flex gap-3">
              <DotNumber n={4} />
              <div>
                <b>여론 분포</b> 찬성 {agreePct.toFixed(0)}% / 반대 { (100 - agreePct).toFixed(0)}% (
                <span className="text-emerald-600 font-semibold">{lean}</span>).
              </div>
            </li>
          </ul>
        </SoftCard>

        {/* 추천 액션 */}
        <SoftCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xl font-extrabold text-neutral-800">추천 액션</h3>
          </div>
          <ul className="space-y-4 text-[15px] text-neutral-800">
            <li className="flex gap-3">
              <DotNumber n={1} />
              <div>
                <Mark>Q&A·팩트시트</Mark>를 선제 배포하여 소셜 프레이밍을 선점하세요.
              </div>
            </li>
            <li className="flex gap-3">
              <DotNumber n={2} />
              <div>
                <Mark>모니터링 주기</Mark>를 단축하고 일일 대시 요약을 구독화합니다.
              </div>
            </li>
            <li className="flex gap-3">
              <DotNumber n={3} />
              <div>
                <Mark>찬성/반대 논점</Mark>을 분리해 이원화 메시지를 운영하세요.
              </div>
            </li>
            <li className="flex gap-3">
              <DotNumber n={4} />
              <div>
                리스크 스코어 <Mark>{risk}/100</Mark>에 따라 대응 우선순위를 재점검합니다.
              </div>
            </li>
          </ul>
        </SoftCard>
      </div>

      {/* 하단: 피크/대표기사 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <SoftCard className="p-6">
          <p className="text-[12px] text-neutral-500 mb-1">뉴스 언급 피크</p>
          <p className="text-[15px]">
            <span className="font-semibold text-emerald-700">{newsPeakLabel}</span> · {newsPeak.count.toLocaleString()}건
          </p>
          {newsTitle && <p className="text-[12px] text-neutral-500 mt-1 italic">“{newsTitle}”</p>}
        </SoftCard>

        <SoftCard className="p-6">
          <p className="text-[12px] text-neutral-500 mb-1">소셜 언급 피크</p>
          <p className="text-[15px]">
            <span className="font-semibold text-emerald-700">{socialPeakLabel}</span> · {socialPeak.count.toLocaleString()}건
          </p>
          {socialTitle && <p className="text-[12px] text-neutral-500 mt-1 italic">“{socialTitle}”</p>}
        </SoftCard>
      </div>
      {/* ────────────────────────────────────────────────
    민트 톤 인사이트 차트 (베른 + 막대 + 설명문)
    레퍼런스 이미지 스타일
──────────────────────────────────────────────── */}
<div className="mt-10 rounded-3xl bg-white border border-emerald-100 shadow-[0_6px_24px_rgba(16,185,129,0.06)] p-6 md:p-8">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
    {/* 1) Venn-like 겹치는 원 */}
    <div className="flex items-center justify-center">
      <MintVenn
        leftLabel="소셜 비중"
        rightLabel="뉴스 비중"
        leftPct={Math.round(
          (enriched.reduce((s, d) => s + d.socialVal, 0) /
            Math.max(1, enriched.reduce((s, d) => s + d.value, 0))) * 100
        )}
        rightPct={100}
        centerBigLabel={`${share.toFixed(1)}%`}
      />
    </div>

    {/* 2) 증가 추이 미니 막대 */}
    <div className="w-full">
      <MintBars
        title="입법수요 언급 증가 추이"
        values={(() => {
          const totalByPoint = seriesOf(topVolume.name).map(
            (p) => (p.news || 0) + (p.social || 0)
          );
          const last5 = totalByPoint.slice(-5);
          return Array.from({ length: 5 - last5.length }, () => 0).concat(last5);
        })()}
        lastLabel={periodLabel}
        colorClass="bg-emerald-500"
        faintClass="bg-emerald-200"
        labelColorClass="text-emerald-600"
        topMarkerValue={(() => {
          const vals = seriesOf(topVolume.name).map(
            (p) => (p.news || 0) + (p.social || 0)
          );
          const base = vals.slice(-5, -4)[0] ?? 1;
          const last = vals.slice(-1)[0] ?? base;
          return (last / Math.max(1, base)) * 1.0;
        })()}
      />
    </div>

    {/* 3) 우측 설명문 */}
    <div className="text-neutral-600 leading-relaxed">
      <p className="mb-3">
        전체 언급 대비 <span className="text-emerald-600 font-semibold">{lawLabel(topVolume.name)}</span>의
        지분은 약 <span className="text-emerald-600 font-bold">{share.toFixed(1)}%</span>이며{" "}
        <span className="text-emerald-600 font-semibold">
          {topAmplify.amp >= 0.9 ? "소셜 주도" : topAmplify.amp >= 0.6 ? "소셜 우세" : topAmplify.amp >= 0.4 ? "혼합" : topAmplify.amp > 0 ? "언론 우세" : "언론 주도"}
        </span> 성격을 보입니다.
      </p>
      <p className="mb-3">
        최근 추이는 완만한 상승세로, 모멘텀{" "}
        <span className="text-emerald-600 font-semibold">{Math.round(momentum)}</span>를 기록했습니다.
      </p>
      <p className="text-[12px] text-neutral-400">
        자료출처 : 여론나침반 AI 분석 (뉴스·소셜 통합)
      </p>
    </div>
  </div>
</div>

    </section>
    
  );
}
/** 민트 톤 겹치는 원 (Venn 느낌) */
function MintVenn({
  leftLabel,
  rightLabel,
  leftPct,
  rightPct,
  centerBigLabel,
}: {
  leftLabel: string;
  rightLabel: string;
  leftPct: number;
  rightPct: number;
  centerBigLabel: string | number;
}) {
  const leftFill = "#34D399";   // emerald-400
  const rightFill = "#A7F3D0";  // emerald-200
  const overlap = "#6EE7B7";    // emerald-300

  const W = 340, H = 220;
  const r1 = 85, r2 = 110;
  const cx1 = 130, cx2 = 200, cy = 110;

  return (
    <div className="text-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={cx2} cy={cy} r={r2} fill={rightFill} opacity={0.95} />
        <circle cx={cx1} cy={cy} r={r1} fill={leftFill} opacity={0.95} />
        <circle cx={(cx1 + cx2) / 2} cy={cy} r={Math.min(r1, r2) * 0.85} fill={overlap} opacity={0.9} />

        <text x={cx1} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontWeight="800" fontSize="28">
          {leftPct}%
        </text>
        <text x={cx1} y={cy + 28} textAnchor="middle" dominantBaseline="middle" fill="#ECFEFF" fontSize="12">
          {leftLabel}
        </text>

        <text x={cx2} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#064E3B" fontWeight="900" fontSize="28">
          {String(rightPct).padStart(2, "0")}%
        </text>
        <text x={cx2} y={cy + 28} textAnchor="middle" dominantBaseline="middle" fill="#065F46" fontSize="12">
          {rightLabel}
        </text>

        <text x={(cx1 + cx2) / 2} y={cy - 35} textAnchor="middle" fill="#065F46" fontWeight="800" fontSize="18">
          {centerBigLabel}
        </text>
      </svg>
      <p className="mt-2 text-[12px] text-neutral-400">소셜·뉴스 상대 비중과 핵심 이슈 지분(%) 비교</p>
    </div>
  );
}

/** 민트 톤 미니 막대 추이 */
function MintBars({
  title,
  values,
  lastLabel,
  topMarkerValue,
  colorClass = "bg-emerald-500",
  faintClass = "bg-emerald-200",
  labelColorClass = "text-emerald-600",
}: {
  title: string;
  values: number[];
  lastLabel?: string;
  topMarkerValue?: number;
  colorClass?: string;
  faintClass?: string;
  labelColorClass?: string;
}) {
  const max = Math.max(...values, 1);
  const bars = values.map((v, i) => ({
    v,
    h: Math.max(8, (v / max) * 110),
    strong: i === values.length - 1,
  }));

  return (
    <div className="w-full">
      <p className="text-center text-neutral-500 text-[13px] mb-3">{title}</p>
      <div className="relative h-[140px] w-full flex items-end justify-between px-2">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={b.strong ? colorClass : faintClass}
                 style={{ width: 26, height: b.h, borderRadius: 6 }} />
          </div>
        ))}
        {typeof topMarkerValue === "number" && (
          <div className="absolute -top-2 right-2 text-[12px] font-extrabold text-emerald-600">
            {topMarkerValue.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-neutral-400 px-2">
        <span>…</span>
        <span className={labelColorClass}>{lastLabel}</span>
      </div>
    </div>
  );
}


