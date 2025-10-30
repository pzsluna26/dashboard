"use client";
import { ResponsiveLine, type Serie } from "@nivo/line";
import { useMemo, useState, useEffect } from "react";
import InfoTooltip from "@/shared/layout/InfoTooltip";
import { useBottomTicks } from "@/shared/hooks/useBottomTicks";
import type { CategoryKey, PeriodLabel } from "@/shared/types/common";
import type { Detail } from "@/shared/types/common";

type LawTrendChartProps = {
  data: {
    name: CategoryKey;
    data: {
      date: string;
      news: number;
      social: number;
      detail?: Detail;
    }[];
  }[];
  period: PeriodLabel;
};

export default function TrendChart({ data, period }: LawTrendChartProps) {
  const [selectedPeak, setSelectedPeak] = useState<any>(null);

  useEffect(() => {
    setSelectedPeak(null);
  }, [period]);

  const allDates = useMemo(() => {
    const s = new Set<string>();
    for (const law of data) for (const d of law.data) s.add(d.date);
    return Array.from(s).sort();
  }, [data]);

  const { bottomTickFormatter: tickFormatter, bottomTickValues: tickValues } =
    useBottomTicks(period, allDates);

  const { chartData, axisLeftLegend } = useMemo(() => {
    const newsSumByDate: Record<string, { y: number; rep?: any }> = {};

    for (const date of allDates) {
      const entries = data
        .map((law) => {
          const found = law.data.find((d) => d.date === date);
          if (!found) return null;

          const normalizedDetail = found.detail
            ? {
              ...found.detail,
              sub:
                typeof (found.detail as any).sub === "string"
                  ? { title: (found.detail as any).sub as unknown as string }
                  : found.detail.sub,
            }
            : undefined;

          return { ...found, law: law.name, detail: normalizedDetail };
        })
        .filter(Boolean) as any[];

      const newsSum = entries.reduce((acc, e) => acc + (e.news ?? 0), 0);

      const newsPeakData =
        entries.length > 0
          ? entries.reduce((a, b) => ((b.news ?? 0) > (a.news ?? 0) ? b : a))
          : undefined;

      newsSumByDate[date] = {
        y: newsSum,
        rep: newsPeakData ? { ...newsPeakData, kind: "news" } : undefined,
      };
    }

    const newsSerie: Serie = {
      id: "뉴스 언급량(합계)",
      data: allDates.map((date) => ({
        x: date,
        y: newsSumByDate[date]?.y ?? 0,
        ...newsSumByDate[date]?.rep,
      })),
    };

    return {
      chartData: [newsSerie],
      axisLeftLegend: "언급량(합계)",
    };
  }, [data, allDates]);

  const colors = ["#38bdf8", "#60a5fa"]; // 파랑 톤 유지

  const MaxLabels = ({ series }: any) => {
    const maxNodes = series
      .map((s: any) => {
        const valid = s.data.filter(
          (d: any) => typeof d?.data?.y === "number" && isFinite(d.data.y)
        );
        if (!valid.length) return null;
        const maxDatum = valid.reduce((a: any, b: any) => (b.data.y > a.data.y ? b : a));
        return {
          id: s.id,
          color: s.color,
          value: maxDatum.data.y,
          x: maxDatum.position.x,
          y: maxDatum.position.y,
          raw: maxDatum.data,
        };
      })
      .filter(Boolean);

    return (
      <g>
        {maxNodes.map((p: any, idx: number) => (
          <g
            key={`${p.id}-${idx}`}
            transform={`translate(${p.x}, ${p.y})`}
            className="cursor-pointer"
            onClick={() => setSelectedPeak(p.raw)}
          >
            <circle r={12} fill="#ffffff" stroke={p.color} strokeWidth={3}>
              <title>마커를 클릭하면 우측 카드에서 상세정보를 확인할 수 있습니다.</title>
            </circle>
            <rect
              x={-80}
              y={-47}
              rx={10}
              ry={6}
              width={175}
              height={30}
              fill="rgba(14,165,233,0.12)"
              stroke={p.color}
            />
            <text x={-67} y={-26} fontSize={15} fill="#374151">
              {`${p.id}: ${p.value}`}
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className="flex w-full gap-6">
      {/* 차트 컨테이너 */}
      <div className="w-full sm:w-2/3 h-auto bg-transparent rounded-2xl p-4 text-neutral-700">
        <div className="flex items-center mb-4 gap-2">
          <h3 className="text-xl sm:text-2xl font-semibold">법안별 언급량 추이 ({period}별)</h3>
          <InfoTooltip className="relative z-50">
            <p>
              법안별 뉴스/소셜의 언급량 추이 (<strong>{period}별</strong>) 를 나타냅니다.
              <br />
              마커를 클릭하면 해당 일자의 가장 언급이 많았던 핫이슈 사건 (관련 기사수),
              사건의 테마, 관련 대표 기사와 여론의 찬/반 비율을 확인할 수 있습니다.
            </p>
          </InfoTooltip>
        </div>
        <div className="bg-white/60 rounded-2xl p-2 shadow-sm">
          <div style={{ height: "300px" }}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 40, right: 120, bottom: 60, left: 70 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", stacked: false }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -35,
                tickValues,
                format: tickFormatter,
                legend: "기간",
                legendOffset: 46,
                legendPosition: "middle",
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                legend: axisLeftLegend,
                legendOffset: -40,
                legendPosition: "middle",
              }}
              colors={colors}
              enablePoints={false}
              lineWidth={2}
              enableArea={true}
              areaOpacity={0.35}
              useMesh={true}
              theme={{
                textColor: "#374151", // neutral-700
                axis: {
                  domain: { line: { stroke: "#9ca3af" } }, // neutral-400
                  ticks: {
                    line: { stroke: "#cbd5e1" }, // slate-300
                    text: { fill: "#374151" },    // neutral-700
                  },
                },
                grid: { line: { stroke: "#e5e7eb" } }, // neutral-200
                crosshair: { line: { stroke: "#38bdf8", strokeWidth: 1 } },
                tooltip: {
                  container: { background: "rgba(255,255,255,0.9)", color: "#111827" },
                },
              }}
              legends={[
                {
                  anchor: "bottom-right",
                  direction: "column",
                  translateX: 130,
                  itemWidth: 120,
                  itemHeight: 20,
                  symbolSize: 12,
                  itemTextColor: "#374151", // neutral-700
                },
              ]}
              layers={[
                "grid",
                "markers",
                "areas",
                "lines",
                "slices",
                "axes",
                "points",
                "legends",
                "crosshair",
                MaxLabels,
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
