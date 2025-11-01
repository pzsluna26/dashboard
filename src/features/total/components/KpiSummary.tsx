"use client";

import React, { useEffect, useMemo } from "react";
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
  label: string;
  value: number;
  deltaPct?: number;
  growthRate?: number;
  series?: SeriesPoint[];
  socialSeries?: SeriesPoint[];
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

function pickDelta(item: KpiSeries) {
  return typeof item.deltaPct === "number"
    ? item.deltaPct
    : typeof item.growthRate === "number"
    ? item.growthRate
    : undefined;
}

function valueWithAffixes(item: KpiSeries) {
  return `${item.prefix ?? ""}${formatNumber(Number(item.value) || 0)}${
    item.suffix ?? ""
  }`;
}

/** 🔎 mergeSeries 입/출력 스냅샷 로깅 */
function mergeSeries(level?: SeriesPoint[], social?: SeriesPoint[]) {
  console.debug("[KpiSummary/mergeSeries] 입출력 각 카드 시계열", {
    levelLen: level?.length ?? 0,
    socialLen: social?.length ?? 0,
    levelHead: level?.[0],
    socialHead: social?.[0],
  });

  const map = new Map<string, { date: string; level: number; social: number }>();
  (level ?? []).forEach((p) =>
    map.set(p.date, { date: p.date, level: p.value, social: 0 })
  );
  (social ?? []).forEach((p) => {
    const prev = map.get(p.date) ?? { date: p.date, level: 0, social: 0 };
    prev.social = p.value;
    map.set(p.date, prev);
  });
  const merged = Array.from(map.values()).sort((a, b) =>
    a.date > b.date ? 1 : -1
  );

  console.debug("[KpiSummary/mergeSeries] output", {
    mergedLen: merged.length,
    head: merged[0],
    tail: merged[merged.length - 1],
  });

  return merged;
}

function deltaSentence(item: KpiSeries) {
  const d = pickDelta(item);
  if (d === undefined || d === null) return "변화 없음";
  const dir = d > 0 ? "증가" : d < 0 ? "감소" : "변동 없음";
  return `${Math.abs(Math.round(d * 10) / 10)}% ${dir}`;
}

/** 🔎 KpiCard: 카드별 최종 시리즈 상태 로깅 */
function KpiCard({ item }: { item: KpiSeries }) {
  const delta = pickDelta(item) ?? 0;
  const up = delta > 0;
  const down = delta < 0;

  const levelSeries = Array.isArray(item.series) ? item.series : [];
  const socialSeries = Array.isArray(item.socialSeries)
    ? item.socialSeries
    : undefined;
  const data = mergeSeries(levelSeries, socialSeries);
  const hasSocial = !!socialSeries && socialSeries.length > 0;

  useEffect(() => {
    console.log("[KpiCard] 최종 머지된 데이터 길이와 헤드/테일", {
      label: item.label,
      value: item.value,
      delta,
      levelLen: levelSeries.length,
      socialLen: socialSeries?.length ?? 0,
      mergedLen: data.length,
      mergedHead: data[0],
      mergedTail: data[data.length - 1],
    });
  }, [
    item,
    delta,
    levelSeries.length,
    socialSeries?.length,
    data.length,
  ]);

  return (
    <div
      className={cx(
        "transition-transform duration-200 hover:scale-[1.015]",
        "rounded-2xl p-4 border shadow-xl",
        "bg-gradient-to-br from-white/70 to-neutral-100/60 backdrop-blur-lg border-neutral-200"
      )}
    >
      <div className="text-xs text-neutral-500 font-semibold">
        {item.label ?? "-"}
      </div>

      <div className="mt-1 flex items-end gap-2">
        <div className="text-3xl font-black text-neutral-900">
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
          {formatDelta(delta)}
          {item.subtitle ? (
            <span className="text-neutral-400 font-normal ml-1">
              {item.subtitle}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} stackOffset="none">
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              formatter={(value: any, name: string) => {
                // console.log("[KpiCard/Tooltip]", { name, value }); // 필요 시 활성화
                if (name === "level")
                  return [formatNumber(Number(value) || 0), "뉴스"];
                if (name === "social")
                  return [
                    formatNumber(Number(value) || 0),
                    "소셜(찬성+반대)",
                  ];
                return [value, name];
              }}
              labelFormatter={(l) => l}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                background: "rgba(255,255,255,0.95)",
                border: "1px solid #ddd",
              }}
            />
            <Area
              type="monotone"
              dataKey="level"
              stackId="sum"
              stroke="#475569"
              fill="#cbd5e1"
              fillOpacity={0.9}
              name="level"
            />
            {hasSocial && (
              <Area
                type="monotone"
                dataKey="social"
                stackId="sum"
                stroke="#60a5fa"
                fill="#bae6fd"
                fillOpacity={0.7}
                name="social"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** 🔎 KpiSummary: props/형태/아이템 구성 스냅샷 로깅 */
export default function KpiSummary({
  kpis,
  periodLabel,
  startDate,
  endDate,
}: Props) {
  useEffect(() => {
    console.log("[KpiSummary] 사용자 지정기간", {
      periodLabel,
      startDate,
      endDate,
      kpisType: Array.isArray(kpis) ? "array" : typeof kpis,
      kpiKeys: !Array.isArray(kpis) && kpis ? Object.keys(kpis) : undefined,
    });
  }, [kpis, periodLabel, startDate, endDate]);

  if (!kpis) return null;

  const items: KpiSeries[] = useMemo(() => {
    const built = Array.isArray(kpis)
      ? kpis.slice(0, 4).map((x: any) => ({
          label: x?.name ?? "-",
          value: Number(x?.value) || 0,
          growthRate: typeof x?.growthRate === "number" ? x.growthRate : 0,
          series: Array.isArray(x?.trend)
            ? x.trend.map((v: number, i: number) => ({
                date: String(i + 1),
                value: Number(v) || 0,
              }))
            : [],
          socialSeries: Array.isArray(x?.socialTrend)
            ? x.socialTrend.map((v: number, i: number) => ({
                date: String(i + 1),
                value: Number(v) || 0,
              }))
            : undefined,
          suffix: "건",
        }))
      : [
          (kpis as KpisShape).issueVolume,
          (kpis as KpisShape).supportRatio,
          (kpis as KpisShape).supportPerTopic,
          (kpis as KpisShape).netSentiment,
        ].filter(Boolean);

    console.log("[KpiSummary] kpis해석결과", {
      count: built.length,
      labels: built.map((b) => b?.label),
      firstItem: built[0],
    });

    return built;
  }, [kpis]);

  return (
    <div className="w-full">
      <div className="mb-3 text-sm text-neutral-500">{periodLabel}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((it, idx) => (
          <KpiCard key={idx} item={it} />
        ))}
      </div>
    </div>
  );
}
