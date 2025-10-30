// 종합분석(누적라인차트+상세정보카드)

"use client";
import { ResponsiveLine, type Serie } from "@nivo/line";
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useBottomTicks } from "@/shared/hooks/useBottomTicks";
import type { CategoryKey, PeriodLabel } from "@/shared/types/common";
import type { Detail } from "@/shared/types/common";
import { LAW_LABEL } from '@/shared/constants/labels';
import { getSocialValue } from "@/shared/utils/computeKpis";

type LawTrendChartProps = {
  data: {
    name: CategoryKey;
    data: {
      date: string;
      news: number;
      social: number;
      detail?: Detail;
      rawSocial?: {
        counts?: {
          찬성?: number;
          반대?: number;
        };
        찬성_대표의견?: string[];
        반대_대표의견?: string[];
      };
    }[];
  }[];
  period: PeriodLabel;
};

export default function LawTrendChart({ data, period }: LawTrendChartProps) {
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
    const socialSumByDate: Record<string, { y: number; rep?: any }> = {};
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

      const socialSum = entries.reduce((acc, e) => acc + getSocialValue(e.rawSocial), 0);
      const newsSum = entries.reduce((acc, e) => acc + (e.news ?? 0), 0);

      const socialPeakData =
        entries.length > 0
          ? entries.reduce((a, b) =>
              getSocialValue(b.rawSocial) > getSocialValue(a.rawSocial) ? b : a
            )
          : undefined;

      const newsPeakData =
        entries.length > 0
          ? entries.reduce((a, b) => ((b.news ?? 0) > (a.news ?? 0) ? b : a))
          : undefined;

      socialSumByDate[date] = {
        y: socialSum,
        rep: socialPeakData ? { ...socialPeakData, kind: "social" } : undefined,
      };

      newsSumByDate[date] = {
        y: newsSum,
        rep: newsPeakData ? { ...newsPeakData, kind: "news" } : undefined,
      };
    }

    const socialSerie: Serie = {
      id: "소셜 언급량(합계)",
      data: allDates.map((date) => ({
        x: date,
        y: socialSumByDate[date]?.y ?? 0,
        ...socialSumByDate[date]?.rep,
      })),
    };

    const newsSerie: Serie = {
      id: "뉴스 언급량(합계)",
      data: allDates.map((date) => ({
        x: date,
        y: newsSumByDate[date]?.y ?? 0,
        ...newsSumByDate[date]?.rep,
      })),
    };

    return {
      chartData: [socialSerie, newsSerie],
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
            {/* 텍스트를 중립 700으로 */}
            <text x={-67} y={-26} fontSize={15} fill="#374151">
              {`${p.id}: ${p.value}`}
            </text>
          </g>
        ))}
      </g>
    );
  };

  function getPolarized(rawSocial?: any) {
    const flat = getSocialValue(rawSocial);
    const agree = rawSocial?.counts?.찬성 ?? rawSocial?.찬성 ?? 0;
    const disagree = rawSocial?.counts?.반대 ?? rawSocial?.반대 ?? 0;
    const total = agree + disagree;
    const agreePct = total ? Math.round((agree / total) * 100) : 0;
    const disagreePct = total ? 100 - agreePct : 0;

    return {
      agree,
      disagree,
      total,
      agreePct,
      disagreePct,
      agreeRep: rawSocial?.찬성_대표의견?.[0],
      disagreeRep: rawSocial?.반대_대표의견?.[0],
    };
  }

  // 우측 카드
  const Card = () => {
    if (!selectedPeak) {
      return (
        <div className="w-1/3 bg-transparent rounded-2xl p-6 text-neutral-700">
          <h3 className="text-2xl font-semibold mb-4">이슈에 대한 여론반응</h3>
          <p className="text-neutral-700/70">
            최대값 마커를 클릭하면 상세 정보가 여기에 표시됩니다.
          </p>
        </div>
      );
    }

    const law = selectedPeak.law ?? "-";
    const rawDate: string = selectedPeak.x ?? "-";
    const displayDate =
      typeof tickFormatter === "function" ? tickFormatter(rawDate) : rawDate;

    const detail: Detail | undefined = selectedPeak.detail;
    const pol = getPolarized(selectedPeak.rawSocial);

    const isSocial = selectedPeak.kind === "social";
    const title = isSocial ? "소셜이 주목한 이슈" : "언론이 주목한 이슈";

    return (
      <div className="w-1/3 bg-transparent rounded-2xl p-6 text-neutral-700">
        <div className="flex items-center mb-4 gap-2">
          <h3 className="text-2xl font-semibold">
            {title} ({period}별)
          </h3>
          <Image
            src="/icons/info.png"
            alt="도움말"
            width={24}
            height={24}
            title={`${title}(${period}별)의 해당 법안명, 일자, 핫이슈 사건(관련 기사수), 사건의 테마, 관련 대표 기사와 해당 날짜 여론의 찬성/반대 비율을 나타냅니다.`}
            className="object-contain cursor-pointer"
          />
        </div>

        <h4 className="text-xl font-semibold ">
          {LAW_LABEL[law as keyof typeof LAW_LABEL] ?? law}{" "}
          (<abbr title={rawDate}>{displayDate}</abbr>)
        </h4>

        <p className="mb-1">
          <span className="font-semibold text-lg">이 날의 핫이슈 사건:</span>{" "}
          {detail?.sub?.title ?? "정보 없음"}
          {typeof detail?.count === "number" && (
            <span className="text-neutral-700/70"> (관련 기사 {detail.count}건)</span>
          )}
        </p>
        {detail?.mid && (
          <p className="text-lg text-neutral-700/70 mb-4">테마: {detail.mid}</p>
        )}
        {detail?.article && (
          <div className="mt-10 flex flex-col">
            <p className="font-semibold mb-1 text-lg">관련 대표 기사</p>
            <a
              href={detail.article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
            >
              {detail.article.title}
            </a>
          </div>
        )}

        {/* 찬반 가로 누적 막대 (라이트 배경에 맞게 톤 조정) */}
        <div className="mt-10 mb-2">
          <h1 className="text-xl font-semibold">'{displayDate}' 여론 찬/반 비율</h1>
          <div className="w-full h-6 bg-neutral-300 rounded overflow-hidden flex mt-2">
            <div
              className="h-6"
              style={{ width: `${pol.agreePct}%`, backgroundColor: "rgba(40,125,253,0.46)" }}
              title={`찬성 ${pol.agreePct}%`}
            />
            <div
              className="h-6"
              style={{
                width: `${pol.disagreePct}%`,
                backgroundColor: "rgba(120, 120, 120, 0.35)",
              }}
            />
          </div>
          <div className="flex justify-between text-sm mt-1 text-neutral-700">
            <span>찬성 {pol.agreePct}% ({pol.agree})</span>
            <span>반대 {pol.disagreePct}% ({pol.disagree})</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full gap-6">
      {/* 차트 컨테이너: 투명 + 텍스트 중립 700 */}
      <div className="w-2/3 h-full bg-transparent rounded-2xl p-4 text-neutral-700">
        <div className="flex items-center mb-4 gap-2">
          <h3 className="text-2xl font-semibold">법안별 언급량 추이 ({period}별)</h3>
        </div>
        <div style={{ height: 350 }}>
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

      {/* 우측 카드 */}
      <Card />
    </div>
  );
}
