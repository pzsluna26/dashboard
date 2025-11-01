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
          disagree += sub?.["반대"]?.count || 0;
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
      height: 260,
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
        // this.points: 각 시리즈의 포인트들
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
        <HighchartsReact highcharts={Highcharts} options={options} 
        containerProps={{ style: { height: "100%", width: "100%" } }} />
      </div>

      {/* 변화 요약 */}
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
    </div>
  );
}
