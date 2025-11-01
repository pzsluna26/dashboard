"use client";
import React, { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

/**
 * LegislativeFieldHeatmap (Highcharts version, Turbopack-safe UMD init)
 * - x축: addsocial의 개정강화 / 폐지약화(또는 폐지완화) / 반대
 * - y축: 기존과 동일 (최상위 분야 키 = rows)
 * - 툴팁: 정확한 비율(%) + 해당 버킷의 댓글 수
 * - 팔레트: #FFCDB2 → #FFB4A2 → #E5989B → #B5828C (colorAxis.stops)
 */

export default function Heatmap({
  data,
  period = "weekly_timeline",
  startDate,
  endDate,
}: {
  data: any;
  period?: "daily_timeline" | "weekly_timeline" | "monthly_timeline";
  startDate?: string;
  endDate?: string;
}) {
  const [hcReady, setHcReady] = useState(false);

  // Highcharts heatmap 모듈 초기화 (UMD 사이드이펙트)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      try {
        // UMD가 window.Highcharts를 찾도록 설정
        (window as any).Highcharts = Highcharts;

        // Turbopack에서 ESM/CJS 꼬임 회피: 호출 없이 사이드이펙트 import
        await import("highcharts/modules/heatmap.js").catch(async () => {
          // 일부 배포본에서 .js 확장자가 없을 수 있어 fallback
          await import("highcharts/modules/heatmap");
        });

        if (!cancelled) setHcReady(true);
      } catch (e) {
        console.error("Highcharts heatmap init failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { rows, cols, points, insights } = useMemo(() => {
    if (!data) {
      return {
        rows: [] as string[],
        cols: [] as string[],
        points: [] as { x: number; y: number; value: number; total: number }[],
        insights: [] as string[],
      };
    }

    const rows = Object.keys(data); // 분야 (y축)

    // x축을 addsocial의 3개 버킷으로 고정
    const cols = ["개정강화", "폐지약화", "반대"] as const;

    // 일자 필터 (일단위에서만 사용)
    const inRange = (key: string) => {
      if (period !== "daily_timeline" || !startDate || !endDate) return true;
      return key >= startDate && key <= endDate; // YYYY-MM-DD 문자열 비교
    };

    // 집계: 각 분야(row)별로 버킷(개정강화/폐지약화/반대) 합산
    type BucketKey = (typeof cols)[number];
    const agg: Record<string, Record<BucketKey, number>> = {};

    for (const row of rows) {
      agg[row] = { "개정강화": 0, "폐지약화": 0, "반대": 0 };

      const timeline =
        data[row]?.addsocial?.[
          period === "daily_timeline" ? "daily_timeline" : period
        ] ?? {};

      for (const k of Object.keys(timeline)) {
        if (period === "daily_timeline" && !inRange(k)) continue;
        const entry = timeline[k];
        const mids = entry?.["중분류목록"] ?? {};

        for (const mid of Object.keys(mids)) {
          const subMap = mids[mid]?.["소분류목록"] ?? {};

          for (const subKey of Object.keys(subMap)) {
            const sub = subMap[subKey] ?? {};

            // 개정강화 / 폐지약화(또는 폐지완화) / 반대 카운트 안정적으로 추출
            const gaejeong = Number(
              sub?.["찬성"]?.["개정강화"]?.count ?? 0
            );
            // 생성 스크립트는 "폐지약화" 를 사용하지만, 사용자가 "폐지완화" 라고 입력할 가능성 대응
            const paejiYakhwa = Number(
              sub?.["찬성"]?.["폐지약화"]?.count ?? 0
            );
            const paejiWanhwa = Number(
              sub?.["찬성"]?.["폐지완화"]?.count ?? 0
            );
            const paeji = paejiYakhwa || paejiWanhwa;

            // 반대: counts["반대"] 가 신뢰 가능한 합계이며, 없으면 소셜목록 길이로 대체
            const bandae = Number(sub?.counts?.["반대"]) ||
              (Array.isArray(sub?.["반대"]?.["소셜목록"]) ? sub["반대"]["소셜목록"].length : 0);

            agg[row]["개정강화"] += gaejeong;
            agg[row]["폐지약화"] += paeji;
            agg[row]["반대"] += bandae;
          }
        }
      }
    }

    // 포인트 구성: value = 해당 버킷 비율(= bucket / rowTotal), total = 해당 버킷 절대값
    type Pt = { x: number; y: number; value: number; total: number };
    const points: Pt[] = [];

    for (let y = 0; y < rows.length; y++) {
      const rowKey = rows[y];
      const rowTotal =
        agg[rowKey]["개정강화"] + agg[rowKey]["폐지약화"] + agg[rowKey]["반대"];

      for (let x = 0; x < cols.length; x++) {
        const colKey = cols[x];
        const bucket = agg[rowKey][colKey];
        const ratio = rowTotal > 0 ? bucket / rowTotal : 0;
        points.push({ x, y, value: ratio, total: bucket });
      }
    }

    // 인사이트 (가장 높은 비율, 가장 낮은 비율, 절대 수 최다)
    type Cell = { rowKey: string; colKey: BucketKey; ratio: number; total: number };
    const cells: Cell[] = [];
    for (let y = 0; y < rows.length; y++) {
      const rowKey = rows[y];
      const rowTotal =
        agg[rowKey]["개정강화"] + agg[rowKey]["폐지약화"] + agg[rowKey]["반대"];
      for (let x = 0; x < cols.length; x++) {
        const colKey = cols[x];
        const bucket = agg[rowKey][colKey];
        const ratio = rowTotal > 0 ? bucket / rowTotal : 0;
        cells.push({ rowKey, colKey, ratio, total: bucket });
      }
    }

    const byRatioDesc = [...cells].sort((a, b) => b.ratio - a.ratio);
    const byRatioAsc = [...cells].sort((a, b) => a.ratio - b.ratio);
    const byTotalDesc = [...cells].sort((a, b) => b.total - a.total);
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    const insights: string[] = [];
    if (byRatioDesc[0])
      insights.push(
        `최고 비율: ${byRatioDesc[0].rowKey} · ${byRatioDesc[0].colKey} (${pct(
          byRatioDesc[0].ratio
        )}, 댓글 ${byRatioDesc[0].total.toLocaleString()}건)`
      );
    if (byRatioAsc[0])
      insights.push(
        `최저 비율: ${byRatioAsc[0].rowKey} · ${byRatioAsc[0].colKey} (${pct(
          byRatioAsc[0].ratio
        )}, 댓글 ${byRatioAsc[0].total.toLocaleString()}건)`
      );
    if (byTotalDesc[0])
      insights.push(
        `댓글 최다: ${byTotalDesc[0].rowKey} · ${byTotalDesc[0].colKey} (${byTotalDesc[0].total.toLocaleString()}건)`
      );

    return { rows, cols: Array.from(cols), points, insights };
  }, [data, period, startDate, endDate]);

  // 차트 옵션
  const options: Highcharts.Options = useMemo(
    () => ({
      chart: {
        type: "heatmap",
        height: 220,
        backgroundColor: "transparent",
        spacing: [10, 10, 10, 10],
        style: { fontFamily: "ui-sans-serif, system-ui, -apple-system" },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: "right",
        verticalAlign: "top",
        layout: "vertical",
        symbolHeight: 120,
        margin: 16,
      },
      xAxis: {
        categories: cols as any,
        title: { text: "의견 유형" },
        labels: { style: { color: "#525252" } },
      },
      yAxis: {
        categories: rows as any,
        title: { text: "분야" },
        reversed: true,
        labels: { style: { color: "#525252" } },
      },
      colorAxis: {
        min: 0,
        max: 1,
        stops: [
          [0, "#FFCDB2"],
          [1 / 3, "#FFB4A2"],
          [2 / 3, "#e5989bb2"],
          [1, "#b5828caf"],
        ],
      },
      tooltip: {
        useHTML: true,
        formatter: function () {
          const xCat = (this.series.xAxis as any).categories[this.point.x];
          const yCat = (this.series.yAxis as any).categories[this.point.y];
          const ratio = (this.point as any).value as number;
          const total = (this.point as any).total as number;
          return `<div style="padding:4px 6px;">
            <div style="font-weight:600;margin-bottom:2px;">${yCat} · ${xCat}</div>
            <div>${(ratio * 100).toFixed(1)}% · 댓글 ${total.toLocaleString()}건</div>
          </div>`;
        },
      },
      series: [
        {
          type: "heatmap",
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function () {
              return `${(((this.point as any).value as number) * 100).toFixed(0)}%`;
            },
            style: { color: "#222", textOutline: "none", fontSize: "10px" },
          },
          states: { hover: { enabled: true } },
          data: points as any,
        },
      ],
      responsive: {
        rules: [
          {
            condition: { maxWidth: 768 },
            chartOptions: {
              chart: { height: 300 },
              legend: { enabled: false },
              xAxis: { labels: { style: { fontSize: "10px" } } },
              yAxis: { labels: { style: { fontSize: "10px" } } },
              series: [{ dataLabels: { style: { fontSize: "9px" } } }] as any,
            },
          },
        ],
      },
    }),
    [rows, cols, points]
  );

  if (!hcReady) {
    return (
      <div className="w-full h-full grid place-items-center text-neutral-400">
        차트 모듈 로딩 중…
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-2">
        <HighchartsReact highcharts={Highcharts} options={options} immutable />
      </div>

      {/* 인사이트 */}
      <div className="mt-3 text-xs text-neutral-700 space-y-1">
        {insights.map((line, i) => (
          <div key={i}>• {line}</div>
        ))}
        {insights.length === 0 && (
          <div className="text-neutral-500">표시할 인사이트가 없습니다.</div>
        )}
      </div>
    </div>
  );
}