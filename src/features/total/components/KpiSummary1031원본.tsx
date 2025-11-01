// features/news/components/KpiSummary.tsx
"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
  Tooltip,
  XAxis,
} from "recharts";

type SeriesPoint = { date: string; value: number };

type KpiSeries = {
  label: string;               // 카드 타이틀
  value: number;               // 선택기간 집계값
  deltaPct?: number;           // 전년동기간(or 전기간) 대비 증감(%)
  growthRate?: number;         // computeKpis가 growthRate로 줄 때 대응
  series?: SeriesPoint[];      // ✅ 뉴스량(레벨) 시계열
  socialSeries?: SeriesPoint[];// ✅ 소셜합(찬성+반대) 시계열
  prefix?: string;
  suffix?: string;
  subtitle?: string;
};

type KpisShape = {
  issueVolume: KpiSeries;
  supportRatio: KpiSeries;
  supportPerTopic: KpiSeries;
  netSentiment: KpiSeries;
};

interface Props {
  kpis: KpisShape | any[];
  periodLabel: string;
  startDate?: string;
  endDate?: string;
}

// 간단 className 합성
function cx(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}
function formatNumber(n: number) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  if (Math.abs(n) >= 1000) return `${Math.round(n).toLocaleString()}`;
  if (Math.abs(n) >= 100) return `${Math.round(n)}`;
  return `${Math.round(n * 10) / 10}`;
}
function formatDelta(delta?: number) {
  if (delta === undefined || delta === null) return "–";
  const sign = delta > 0 ? "▲" : delta < 0 ? "▼" : "■";
  return `${sign} ${Math.abs(Math.round(delta * 10) / 10)}%`;
}

// 뉴스/소셜 시계열을 date 기준 병합 (누적용: 빈 값은 0으로)
function mergeSeries(level?: SeriesPoint[], social?: SeriesPoint[]) {
  const map = new Map<string, { date: string; level: number; social: number }>();
  (level ?? []).forEach((p) => map.set(p.date, { date: p.date, level: p.value, social: 0 }));
  (social ?? []).forEach((p) => {
    const prev = map.get(p.date) ?? { date: p.date, level: 0, social: 0 };
    prev.social = p.value;
    map.set(p.date, prev);
  });
  return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

/** ---------- 인사이트용 헬퍼 ---------- */
function pickDelta(item: KpiSeries) {
  return typeof item.deltaPct === "number"
    ? item.deltaPct
    : typeof item.growthRate === "number"
    ? item.growthRate
    : undefined;
}
function valueWithAffixes(item: KpiSeries) {
  return `${item.prefix ?? ""}${formatNumber(Number(item.value) || 0)}${item.suffix ?? ""}`;
}
function deltaSentence(item: KpiSeries) {
  const d = pickDelta(item);
  if (d === undefined || d === null) return "변화 없음";
  const dir = d > 0 ? "증가" : d < 0 ? "감소" : "변동 없음";
  return `${Math.abs(Math.round(d * 10) / 10)}% ${dir}`;
}
/** ----------------------------------- */

function KpiCard({ item }: { item: KpiSeries }) {
  const delta =
    typeof item.deltaPct === "number"
      ? item.deltaPct
      : typeof item.growthRate === "number"
      ? item.growthRate
      : 0;

  const up = (delta ?? 0) > 0;
  const down = (delta ?? 0) < 0;

  const levelSeries = Array.isArray(item.series) ? item.series : [];
  const socialSeries = Array.isArray(item.socialSeries) ? item.socialSeries : undefined;
  const data = mergeSeries(levelSeries, socialSeries);
  const hasSocial = !!socialSeries && socialSeries.length > 0;

  return (
    <div className="rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
      <div className="text-xs text-neutral-500 font-medium">{item.label ?? "-"}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="text-2xl font-semibold text-neutral-900">
          {item.prefix ?? ""}
          {formatNumber(Number(item.value) || 0)}
          {item.suffix ?? ""}
        </div>
        <div
          className={cx(
            "text-xs font-semibold",
            up && "text-emerald-600",
            down && "text-rose-600",
            !up && !down && "text-neutral-500"
          )}
        >
          {formatDelta(delta)}{" "}
          {item.subtitle ? <span className="text-neutral-400 font-normal">{item.subtitle}</span> : null}
        </div>
      </div>

      {/* 누적 면적 차트: level(뉴스) + social(소셜합) 한 축에 스택 */}
      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} stackOffset="none">
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === "level") return [formatNumber(Number(value) || 0), "뉴스"];
                if (name === "social") return [formatNumber(Number(value) || 0), "소셜(찬성+반대)"];
                return [value, name];
              }}
              labelFormatter={(l) => l}
              contentStyle={{ fontSize: 12 }}
            />
            {/* 뉴스 영역 */}
            <Area
              type="monotone"
              dataKey="level"
              stackId="sum"
              stroke="#64748B"
              fill="#CBD5E1"
              fillOpacity={0.8}
              name="level"
            />
            {/* 소셜 영역 (#85b5d3) */}
            {hasSocial && (
              <Area
                type="monotone"
                dataKey="social"
                stackId="sum"
                stroke="#85b5d3"
                fill="#85b5d3"
                fillOpacity={0.6}
                name="social"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function KpiSummary({ kpis, periodLabel }: Props) {
  if (!kpis) return null;

  // 배열형(KpiItem[]) → 앞 4개를 KpiSeries로 매핑
  // { name, value, growthRate, trend:number[], socialTrend?:number[] } 지원
  const items: KpiSeries[] = Array.isArray(kpis)
    ? kpis.slice(0, 4).map((x: any) => ({
        label: x?.name ?? "-",
        value: Number(x?.value) || 0,
        growthRate: typeof x?.growthRate === "number" ? x.growthRate : 0,
        // 뉴스 시계열 (레벨)
        series: Array.isArray(x?.trend)
          ? x.trend.map((v: number, i: number) => ({
              date: String(i + 1), // 실제 날짜 문자열을 쓰고 싶다면 여기서 교체
              value: Number(v) || 0,
            }))
          : [],
        // 소셜 시계열 (찬성+반대 합)
        socialSeries: Array.isArray(x?.socialTrend)
          ? x.socialTrend.map((v: number, i: number) => ({
              date: String(i + 1),
              value: Number(v) || 0,
            }))
          : undefined,
        suffix: "건",
      }))
    // 객체형(KpisShape) → 그대로 사용 (필요 시 각 KPI에 socialSeries를 추가해 전달)
    : [
        (kpis as KpisShape).issueVolume,
        (kpis as KpisShape).supportRatio,
        (kpis as KpisShape).supportPerTopic,
        (kpis as KpisShape).netSentiment,
      ].filter(Boolean);

  // 3줄 요약 인사이트 (앞의 최대 3개 지표로 구성)
  const top3 = items.slice(0, 3);
  const threeLineInsights = top3.map((it) => {
    const base = `${it.label}은(는) ${valueWithAffixes(it)}로`;
    const delta = deltaSentence(it);
    return `${base}, ${delta}입니다.`;
  });

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-neutral-500">{periodLabel}</div>

      {/* KPI 카드들 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((it, idx) => (
          <KpiCard key={idx} item={it} />
        ))}
      </div>

      {/* 3줄 요약 인사이트 */}
      {/* <div className="mt-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4">
        <div className="text-xs text-neutral-500 font-medium">요약 인사이트</div>
        <div className="mt-2 space-y-1.5 text-sm leading-6 text-neutral-800">
          {threeLineInsights.length === 0 ? (
            <div className="text-neutral-400">요약할 지표가 없습니다.</div>
          ) : (
            threeLineInsights.map((line, i) => (
              <p key={i} className="before:content-['•'] before:mr-2 before:text-neutral-400">
                {line}
              </p>
            ))
          )}
        </div>
      </div> */}
    </div>
  );
}
