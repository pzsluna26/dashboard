// features/news/components/KpiSummary.tsx
"use client";

import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

type SeriesPoint = { date: string; value: number };

type KpiSeries = {
  label: string;              // 카드 타이틀
  value: number;              // 선택기간 집계값
  deltaPct?: number;          // 전년동기간(or 전기간) 대비 증감(%)
  growthRate?: number;        // computeKpis가 growthRate로 줄 때 대응
  series?: SeriesPoint[];     // 스파크라인 시계열 (선택기간 내)
  prefix?: string;            // "$", "" 등
  suffix?: string;            // "건", "%", 등
  subtitle?: string;          // 보조 라벨 (예: "vs 2024")
};

type KpisShape = {
  issueVolume: KpiSeries;     // 예: 뉴스/이슈 총량
  supportRatio: KpiSeries;    // 예: 찬성 비율(%)
  supportPerTopic: KpiSeries; // 예: 이슈당 찬성/참여 수
  netSentiment: KpiSeries;    // 예: 순감정(찬성-반대)/전체
};

interface Props {
  // kpis가 객체형(위 KpisShape) 또는 배열형(KpiItem[]) 모두 올 수 있음
  kpis: KpisShape | any[];
  periodLabel: string;
  startDate?: string;
  endDate?: string;
}

// 간단한 className 합성기 (cn 대체)
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

function KpiCard({ item }: { item: KpiSeries }) {
  // deltaPct 없으면 growthRate 사용
  const delta = typeof item.deltaPct === "number"
    ? item.deltaPct
    : (typeof item.growthRate === "number" ? item.growthRate : 0);

  const up = (delta ?? 0) > 0;
  const down = (delta ?? 0) < 0;

  // series가 [{date,value}] 형태가 아니고 숫자 배열(trend)로 올 수도 있어 방어
  const series: SeriesPoint[] = Array.isArray(item.series)
    ? item.series
    : [];

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

      {/* Sparkline */}
      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <Tooltip
              formatter={(v: any) => [v, "값"]}
              labelFormatter={(l) => l}
              contentStyle={{ fontSize: 12 }}
            />
            <Area type="monotone" dataKey="value" stroke="#64748B" fill="#CBD5E1" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function KpiSummary({ kpis, periodLabel }: Props) {
  if (!kpis) return null;

  // kpis가 배열형(KpiItem[])일 때 → 앞 4개를 카드로 변환
  // 각 항목은 { name, value, growthRate, trend:number[] } 형태라고 가정
  const items: KpiSeries[] = Array.isArray(kpis)
    ? kpis.slice(0, 4).map((x: any) => ({
        label: x?.name ?? "-",
        value: Number(x?.value) || 0,
        growthRate: typeof x?.growthRate === "number" ? x.growthRate : 0,
        // trend:number[] → [{date,value}] 변환
        series: Array.isArray(x?.trend)
          ? x.trend.map((v: number, i: number) => ({ date: String(i + 1), value: Number(v) || 0 }))
          : [],
        suffix: "건",
      }))
    // kpis가 객체형(KpisShape)일 때 → 그대로 사용
    : [
        (kpis as KpisShape).issueVolume,
        (kpis as KpisShape).supportRatio,
        (kpis as KpisShape).supportPerTopic,
        (kpis as KpisShape).netSentiment,
      ].filter(Boolean);

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-neutral-500">{periodLabel}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((it, idx) => (
          <KpiCard key={idx} item={it} />
        ))}
      </div>
    </div>
  );
}
