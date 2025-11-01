"use client";
import React, { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export interface Props {
  data: any; // /data/data.json 전체 원본
}

// 지정 색상 (요청사항)
const COLORS = {
  disagree: "#FFCDB2", // 반대
  repeal: "#ACE1AF",  // 폐지완화
  agree: "#C7D9DD",   // 개정강화
};

function parseWeekKey(weekKey: string): { year: number; week: number } {
  const m = weekKey.match(/(\d{4})-W(\d{1,2})/);
  if (!m) return { year: 0, week: 0 };
  return { year: Number(m[1]), week: Number(m[2]) };
}

function compareWeekKey(a: string, b: string) {
  const pa = parseWeekKey(a);
  const pb = parseWeekKey(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.week - pb.week;
}

function formatWeekLabel(weekKey: string) {
  const { year, week } = parseWeekKey(weekKey);
  return `${String(year).slice(2)}년 W${week}`;
}

// 최근 4주 기준으로 비율/카운트 생성
function buildRecent4Weeks(raw: any) {
  const domains = Object.keys(raw || {});
  type Agg = Record<string, { agree: number; repeal: number; disagree: number; total: number }>;
  const weekAgg: Agg = {};

  for (const dom of domains) {
    const weekly = raw[dom]?.addsocial?.["weekly_timeline"] || {};
    for (const weekKey of Object.keys(weekly)) {
      const entry = weekly[weekKey];
      const mids = entry?.["중분류목록"] || {};
      let agree = 0, repeal = 0, disagree = 0;
      for (const mid of Object.keys(mids)) {
        const subs = mids[mid]?.["소분류목록"] || {};
        for (const subKey of Object.keys(subs)) {
          const sub = subs[subKey] || {};
          agree += sub?.["찬성"]?.["개정강화"]?.count || 0;
          repeal += sub?.["찬성"]?.["폐지약화"]?.count || 0;
          // 주의: 생성 스키마상 반대는 counts.반대 또는 반대.소셜목록.length
          const disagreeCount =
            sub?.counts?.["반대"] ??
            (Array.isArray(sub?.["반대"]?.["소셜목록"]) ? sub["반대"]["소셜목록"].length : 0);
          disagree += disagreeCount;
        }
      }
      if (!weekAgg[weekKey]) weekAgg[weekKey] = { agree: 0, repeal: 0, disagree: 0, total: 0 };
      weekAgg[weekKey].agree += agree;
      weekAgg[weekKey].repeal += repeal;
      weekAgg[weekKey].disagree += disagree;
      weekAgg[weekKey].total += agree + repeal + disagree;
    }
  }

  const weeks = Object.keys(weekAgg).sort(compareWeekKey);
  const last4 = weeks.slice(-4);

  const categories = last4.map((wk) => formatWeekLabel(wk));

  const agreeSeries: Highcharts.PointOptionsObject[] = [];
  const repealSeries: Highcharts.PointOptionsObject[] = [];
  const disagreeSeries: Highcharts.PointOptionsObject[] = [];

  for (const wk of last4) {
    const w = weekAgg[wk];
    const tot = Math.max(1, w.total);
    agreeSeries.push({
      y: (w.agree / tot) * 100,
      custom: { count: w.agree, total: w.total, weekKey: wk },
    });
    repealSeries.push({
      y: (w.repeal / tot) * 100,
      custom: { count: w.repeal, total: w.total, weekKey: wk },
    });
    disagreeSeries.push({
      y: (w.disagree / tot) * 100,
      custom: { count: w.disagree, total: w.total, weekKey: wk },
    });
  }

  return { categories, last4, agreeSeries, repealSeries, disagreeSeries };
}

// ── 인사이트 계산 도우미 ─────────────────────────────────────────
type P = Highcharts.PointOptionsObject & { custom?: any; y?: number };
const safePct = (p?: P) => (typeof p?.y === "number" ? p.y : 0);
const safeCnt = (p?: P) => Number(p?.custom?.count ?? 0);
const safeTot = (p?: P) => Number(p?.custom?.total ?? 0);

function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }
function avg(arr: number[]) { return arr.length ? +(sum(arr) / arr.length).toFixed(1) : 0; }

function buildInsights(
  last4: string[],
  agreeSeries: P[],
  repealSeries: P[],
  disagreeSeries: P[]
) {
  const weeks = last4.map(formatWeekLabel);
  const totals = last4.map((_, i) => Math.max(1, safeTot(agreeSeries[i]))); // same total across series

  // 주별 건수 합
  const agreeCnts = agreeSeries.map(safeCnt);
  const repealCnts = repealSeries.map(safeCnt);
  const disagreeCnts = disagreeSeries.map(safeCnt);
  const grandTotal = sum(agreeCnts) + sum(repealCnts) + sum(disagreeCnts);

  // 평균 비중(%) 및 총 건수
  const avgAgreePct = avg(agreeSeries.map(safePct));
  const avgRepealPct = avg(repealSeries.map(safePct));
  const avgDisagreePct = avg(disagreeSeries.map(safePct));

  // 리딩 스탠스
  const leader = [
    { key: "개정강화", pct: avgAgreePct, color: COLORS.agree },
    { key: "폐지완화", pct: avgRepealPct, color: COLORS.repeal },
    { key: "반대", pct: avgDisagreePct, color: COLORS.disagree },
  ].sort((a, b) => b.pct - a.pct)[0];

  // 피크 주차(해당 입장 비중이 가장 높은 주)
  const peak = (series: P[]) => {
    let idx = 0, max = -1;
    series.forEach((p, i) => { const v = safePct(p); if (v > max) { max = v; idx = i; } });
    return { label: weeks[idx], pct: +max.toFixed(1) };
  };

  const peaks = {
    agree: peak(agreeSeries),
    repeal: peak(repealSeries),
    disagree: peak(disagreeSeries),
  };

  // 추세(첫주→마지막 주) 변화
  const delta = (series: P[]) =>
    +( (safePct(series.at(-1)) - safePct(series[0])) ).toFixed(1);

  const deltas = {
    agree: delta(agreeSeries),
    repeal: delta(repealSeries),
    disagree: delta(disagreeSeries),
  };

  // 가장 변동성 큰 스탠스(표준편차 대체로 범위 사용)
  const range = (series: P[]) => {
    const arr = series.map(safePct);
    const mx = Math.max(...arr), mn = Math.min(...arr);
    return +(mx - mn).toFixed(1);
  };
  const ranges = [
    { key: "개정강화", r: range(agreeSeries), color: COLORS.agree },
    { key: "폐지완화", r: range(repealSeries), color: COLORS.repeal },
    { key: "반대", r: range(disagreeSeries), color: COLORS.disagree },
  ].sort((a, b) => b.r - a.r);

  return {
    totals: {
      agree: sum(agreeCnts),
      repeal: sum(repealCnts),
      disagree: sum(disagreeCnts),
      grand: grandTotal,
      avgAgreePct,
      avgRepealPct,
      avgDisagreePct,
    },
    leader,
    peaks,
    deltas,
    mostVolatile: ranges[0], // 변동 폭이 가장 큰 입장
  };
}

export default function LegislativeStanceAreaHC({ data }: Props) {
  const { categories, last4, agreeSeries, repealSeries, disagreeSeries } = useMemo(
    () => buildRecent4Weeks(data),
    [data]
  );

  // 하단 요약: 첫주 대비 마지막 주 변화
  const summary = useMemo(() => {
    if (!agreeSeries.length) return null;
    const getDelta = (series: Highcharts.PointOptionsObject[]) =>
      (series[series.length - 1].y as number) - (series[0].y as number);
    return {
      agree: getDelta(agreeSeries),
      repeal: getDelta(repealSeries),
      disagree: getDelta(disagreeSeries),
    };
  }, [agreeSeries, repealSeries, disagreeSeries]);

  // 종합 인사이트
  const insights = useMemo(() => {
    if (!last4.length) return null;
    return buildInsights(last4, agreeSeries as any, repealSeries as any, disagreeSeries as any);
  }, [last4, agreeSeries, repealSeries, disagreeSeries]);

  if (!categories.length) {
    return (
      <div className="w-full h-full grid place-items-center text-sm text-neutral-500">
        최근 4주 데이터가 없습니다.
      </div>
    );
  }

  const options: Highcharts.Options = {
    chart: {
      type: "area",
      height: 100,
      backgroundColor: "transparent",
      spacing: [10, 12, 8, 0],
      style: { fontFamily: "inherit" },
    },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      categories,
      tickLength: 0,
      lineColor: "#e5e7eb",
      labels: { style: { color: "#475569", fontSize: "11px" } },
    },
    yAxis: {
      min: 0,
      max: 100,
      tickInterval: 20,
      gridLineColor: "#e5e7eb",
      title: { text: undefined },
      labels: {
        formatter: function () { return `${Math.round(this.value as number)}%`; },
        style: { color: "#475569", fontSize: "11px" },
      },
    },
    legend: {
      align: "right",
      verticalAlign: "top",
      itemStyle: { color: "#334155", fontSize: "11px" },
      symbolRadius: 2,
    },
    tooltip: {
      shared: true,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "#e5e7eb",
      borderRadius: 10,
      padding: 10,
      formatter: function () {
        const pts = (this as any).points as Highcharts.TooltipFormatterContextObject[];
        if (!pts?.length) return false as any;
        const label = (this as any).x as string;
        const rows = pts.map((p) => {
          const name = p.series.name;
          const color = p.color as string;
          const pct = (p.point.y as number) ?? 0;
          const cnt = (p.point as any).custom?.count ?? 0;
          return `<div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color}"></span>
              <span>${name}:</span>
              <b>${pct.toFixed(1)}%</b>
              <span style="opacity:.7">(${cnt.toLocaleString()}건)</span>
            </div>`;
        }).join("");
        const total = (pts[0].point as any).custom?.total ?? 0;
        return `<div style="font-size:12px;">
          <div style="font-weight:600;margin-bottom:6px;">${label}</div>
          ${rows}
          <div style="margin-top:6px;font-size:11px;color:#64748b;">총 ${total.toLocaleString()}건</div>
        </div>`;
      },
      useHTML: true,
    },
    plotOptions: {
      area: {
        stacking: "percent",
        marker: { enabled: false, radius: 2 },
        lineWidth: 1.5,
        fillOpacity: 0.6,
      },
      series: { animation: { duration: 350 } },
    },
    series: [
      {
        type: "area",
        name: "반대",
        color: COLORS.disagree,
        data: disagreeSeries,
      },
      {
        type: "area",
        name: "폐지완화",
        color: COLORS.repeal,
        data: repealSeries,
      },
      {
        type: "area",
        name: "개정강화",
        color: COLORS.agree,
        data: agreeSeries,
      },
    ],
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { height: "100%", width: "100%" } }}
        />
      </div>

      {/* 변화 요약 (첫주 → 마지막 주) */}
      {summary && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
          {([
            { key: "agree", label: "개정강화", color: COLORS.agree },
            { key: "repeal", label: "폐지완화", color: COLORS.repeal },
            { key: "disagree", label: "반대", color: COLORS.disagree },
          ] as const).map(({ key, label, color }) => {
            const delta = (summary as any)[key] as number;
            const up = delta >= 0;
            return (
              <div key={key} className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white/70 px-2 py-1">
                <span className="inline-flex w-2 h-2 rounded-sm" style={{ background: color }} />
                <span className="text-neutral-700">{label}</span>
                <span className={up ? "text-emerald-600" : "text-rose-600"}>
                  {up ? "↗" : "↘"} {Math.abs(delta).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────
          종합 인사이트 (그래프 자동 해석)
      ───────────────────────────────────────── */}
      {insights && (
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-white/70 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm font-medium text-neutral-700">종합 인사이트</span>
            <Badge>최근 4주 기준</Badge>
          </div>

          {/* KPI 배지 */}
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <Badge tone="teal">
              개정강화 {insights.totals.avgAgreePct}% ({insights.totals.agree.toLocaleString()}건)
            </Badge>
            <Badge tone="blue">
              폐지완화 {insights.totals.avgRepealPct}% ({insights.totals.repeal.toLocaleString()}건)
            </Badge>
            <Badge tone="rose">
              반대 {insights.totals.avgDisagreePct}% ({insights.totals.disagree.toLocaleString()}건)
            </Badge>
            <Badge tone="neutral">총 {insights.totals.grand.toLocaleString()}건</Badge>
          </div>

          {/* 서술형 요약 */}
          <ul className="list-disc pl-5 space-y-1 text-[13px] text-neutral-700">
            <li>
              <strong className="font-medium">리딩 스탠스</strong>는{" "}
              <span className="font-semibold" style={{ color: insights.leader.color }}>
                {insights.leader.key}
              </span>{" "}
              (평균 {insights.leader.pct}%) 입니다.
            </li>
            <li>
              <strong className="font-medium">피크 주차</strong> — 개정강화 {insights.peaks.agree.label}({insights.peaks.agree.pct}%),{" "}
              폐지완화 {insights.peaks.repeal.label}({insights.peaks.repeal.pct}%),{" "}
              반대 {insights.peaks.disagree.label}({insights.peaks.disagree.pct}%).
            </li>
            <li>
              <strong className="font-medium">추세</strong> — 개정강화 {fmtDelta(insights.deltas.agree)},{" "}
              폐지완화 {fmtDelta(insights.deltas.repeal)}, 반대 {fmtDelta(insights.deltas.disagree)}.
            </li>
            <li>
              <strong className="font-medium">변동성</strong> — 가장 출렁인 입장은{" "}
              <span className="font-semibold" style={{ color: insights.mostVolatile.color }}>
                {insights.mostVolatile.key}
              </span>{" "}
              (범위 {insights.mostVolatile.r}%p) 입니다.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/* 작은 UI 헬퍼 */
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "teal" | "blue" | "rose";
}) {
  const map = {
    neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
    teal: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    blue: "bg-blue-100 text-blue-700 border border-blue-200",
    rose: "bg-rose-100 text-rose-700 border border-rose-200",
  } as const;
  return <span className={`px-2 py-1 rounded-md text-[11px] ${map[tone]}`}>{children}</span>;
}

function fmtDelta(n: number) {
  const arrow = n >= 0 ? "↗" : "↘";
  const tone = n >= 0 ? "text-emerald-600" : "text-rose-600";
  return <span className={`${tone} font-medium`}>{arrow} {Math.abs(n).toFixed(1)}%p</span>;
}
