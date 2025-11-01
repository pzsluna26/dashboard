"use client";

import React, { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export interface Props {
  data: any;             // /data/data.json 전체 원본
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  period?: string;       // "weekly_timeline"만 사용됨
}

// 지정 색상
const COLORS = {
  disagree: "#FFCDB2", // 반대
  repeal: "#ACE1AF",  // 폐지완화
  agree: "#C7D9DD",   // 개정강화
};

// "2025-W30" → 실제 시작일
function weekKeyToDate(key: string): Date | null {
  const match = key.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return null;
  const [_, year, week] = match;
  const jan4 = new Date(Number(year), 0, 4); // 첫 주 기준
  const start = new Date(jan4);
  const day = jan4.getDay() || 7;
  start.setDate(jan4.getDate() - day + 1 + (Number(week) - 1) * 7);
  return start;
}

// 포맷 라벨 (ex: 25년 W30)
function formatWeekLabel(weekKey: string) {
  const [year, wk] = weekKey.split("-W");
  return `${year.slice(2)}년 W${Number(wk)}`;
}

function buildFilteredWeeks(data: any, startDate?: string, endDate?: string) {
  const domains = Object.keys(data || {});
  const agg: Record<string, { agree: number; repeal: number; disagree: number; total: number }> = {};

  for (const dom of domains) {
    const timeline = data[dom]?.addsocial?.["weekly_timeline"] || {};
    for (const key of Object.keys(timeline)) {
      const weekStart = weekKeyToDate(key);
      if (!weekStart) continue;

      if (
        startDate &&
        endDate &&
        (weekStart < new Date(startDate) || weekStart > new Date(endDate))
      ) {
        continue;
      }

      const mids = timeline[key]?.["중분류목록"] ?? {};
      let agree = 0,
        repeal = 0,
        disagree = 0;
      for (const mid of Object.keys(mids)) {
        const subs = mids[mid]?.["소분류목록"] ?? {};
        for (const subKey of Object.keys(subs)) {
          const sub = subs[subKey];
          agree += sub?.["찬성"]?.["개정강화"]?.count ?? 0;
          repeal += sub?.["찬성"]?.["폐지약화"]?.count ?? 0;
          disagree += sub?.["반대"]?.count ?? 0;
        }
      }

      if (!agg[key]) agg[key] = { agree: 0, repeal: 0, disagree: 0, total: 0 };
      agg[key].agree += agree;
      agg[key].repeal += repeal;
      agg[key].disagree += disagree;
      agg[key].total += agree + repeal + disagree;
    }
  }

  const weekKeys = Object.keys(agg).sort((a, b) => {
    const aDate = weekKeyToDate(a) ?? new Date(0);
    const bDate = weekKeyToDate(b) ?? new Date(0);
    return aDate.getTime() - bDate.getTime();
  });

  const categories = weekKeys.map((k) => formatWeekLabel(k));
  const agreeSeries: Highcharts.PointOptionsObject[] = [];
  const repealSeries: Highcharts.PointOptionsObject[] = [];
  const disagreeSeries: Highcharts.PointOptionsObject[] = [];

  for (const wk of weekKeys) {
    const item = agg[wk];
    const tot = Math.max(item.total, 1);
    agreeSeries.push({
      y: (item.agree / tot) * 100,
      custom: { count: item.agree, total: item.total, weekKey: wk },
    });
    repealSeries.push({
      y: (item.repeal / tot) * 100,
      custom: { count: item.repeal, total: item.total, weekKey: wk },
    });
    disagreeSeries.push({
      y: (item.disagree / tot) * 100,
      custom: { count: item.disagree, total: item.total, weekKey: wk },
    });
  }

  return { categories, agreeSeries, repealSeries, disagreeSeries };
}

export default function LegislativeStanceAreaHC({
  data,
  startDate,
  endDate,
}: Props) {
  const { categories, agreeSeries, repealSeries, disagreeSeries } = useMemo(
    () => buildFilteredWeeks(data, startDate, endDate),
    [data, startDate, endDate]
  );

  const summary = useMemo(() => {
    if (!agreeSeries.length) return null;
    const delta = (series: Highcharts.PointOptionsObject[]) =>
      (series[series.length - 1].y as number) - (series[0].y as number);
    return {
      agree: delta(agreeSeries),
      repeal: delta(repealSeries),
      disagree: delta(disagreeSeries),
    };
  }, [agreeSeries, repealSeries, disagreeSeries]);

  if (!categories.length) {
    return (
      <div className="w-full h-full grid place-items-center text-sm text-neutral-500">
        선택된 기간에 해당하는 데이터가 없습니다.
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
      labels: {
        formatter: function () {
          return `${Math.round(this.value as number)}%`;
        },
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
      useHTML: true,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "#e5e7eb",
      borderRadius: 10,
      padding: 10,
      formatter: function () {
        const pts = (this as any).points as Highcharts.TooltipFormatterContextObject[];
        const label = (this as any).x as string;
        const rows = pts.map((p) => {
          const name = p.series.name;
          const color = p.color as string;
          const pct = (p.point.y as number) ?? 0;
          const cnt = (p.point as any).custom?.count ?? 0;
          return `<div style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;background:${color};border-radius:2px;"></span>
              <span>${name}:</span><b>${pct.toFixed(1)}%</b>
              <span style="opacity:.7;">(${cnt.toLocaleString()}건)</span>
            </div>`;
        }).join("");
        const total = (pts[0].point as any).custom?.total ?? 0;
        return `<div style="font-size:12px;">
          <div style="font-weight:600;margin-bottom:6px;">${label}</div>
          ${rows}
          <div style="margin-top:6px;font-size:11px;color:#64748b;">총 ${total.toLocaleString()}건</div>
        </div>`;
      },
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
