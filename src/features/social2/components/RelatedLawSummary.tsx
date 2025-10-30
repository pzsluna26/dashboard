"use client";

import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

type Props = { socialTimeline: any };

export default function RelatedLawSummaryClient({ socialTimeline }: Props) {
  const [modulesLoaded, setModulesLoaded] = useState(false);

  // ✅ 모듈 안전하게 로드 (Turbopack 호환)
  useEffect(() => {
    (async () => {
      const heatmapModule = await import("highcharts/modules/heatmap");
      const exportingModule = await import("highcharts/modules/exporting");

      const activate = (mod: any) => {
        if (typeof mod === "function") mod(Highcharts);
        else if (mod?.default && typeof mod.default === "function") mod.default(Highcharts);
      };

      activate(heatmapModule);
      activate(exportingModule);
      setModulesLoaded(true);
    })();
  }, []);

  // ✅ 관련법 데이터 추출
  const relatedLaws = useMemo(() => extractRelatedLaws(socialTimeline), [socialTimeline]);

  if (!relatedLaws.length)
    return <div className="text-center text-neutral-500 py-10">관련 법령 데이터가 없습니다.</div>;

  if (!modulesLoaded)
    return <div className="text-center text-neutral-400 py-10">차트 모듈을 불러오는 중...</div>;

  // ✅ 전체 비율 계산
  const totalAgree = relatedLaws.reduce((sum, l) => sum + l.agree, 0);
  const totalDisagree = relatedLaws.reduce((sum, l) => sum + l.disagree, 0);

  // ✅ 바 차트 (법령별 찬반)
  const barOptions: Highcharts.Options = {
    chart: { type: "bar", backgroundColor: "transparent" },
    title: { text: "법령별 찬반 비율" },
    xAxis: { categories: relatedLaws.map((l) => l.name) },
    yAxis: { min: 0, title: { text: "언급 수" } },
    colors: ["#ed9455ab", "#fff8ebff"],
    plotOptions: { series: { stacking: "normal" } },
    series: [
      { name: "찬성", type: "bar", data: relatedLaws.map((l) => l.agree) },
      { name: "반대", type: "bar", data: relatedLaws.map((l) => l.disagree) },
    ],
    credits: { enabled: false },
  };

  // ✅ 반원 도넛 차트 (전체 찬반 비율)
  const pieOptions: Highcharts.Options = {
    chart: { 
      type: "pie", 
      backgroundColor: "transparent", 
      height: 350, 
    },
    title: {
      text: "전체 여론 비율",
      align: "center",
      verticalAlign: "middle",
      y: 70,
      style: { fontSize: "18px", color: "#333" },
    },
    colors: ["#FFD6BA", "#FFE8CD"],
    tooltip: { pointFormat: "<b>{point.percentage:.1f}%</b> ({point.y}건)" },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        center: ["50%", "75%"],
        size: "100%",
        innerSize: "60%",
        dataLabels: {
          enabled: true,
          distance: 20,
          style: { fontSize: "12px", color: "#333" },
          format: "<b>{point.name}</b>: {point.percentage:.1f}%",
        },
      },
    },
    credits: { enabled: false },
    series: [
      {
        name: "비율",
        type: "pie",
        data: [
          { name: "찬성", y: totalAgree },
          { name: "반대", y: totalDisagree },
        ],
      },
    ],
  };

  // ✅ 히트맵 (법령별 찬반 퍼센트)
  const heatmapOptions: Highcharts.Options = {
    chart: { type: "heatmap", backgroundColor: "transparent" },
    title: { text: "법령별 언급 비율 히트맵" },
    xAxis: { categories: relatedLaws.map((l) => l.name) },
    yAxis: { categories: ["찬성", "반대"], title: null },
    colorAxis: { min: 0, minColor: "#f4faecff", maxColor: "#FFBF78" },
    series: [
      {
        type: "heatmap",
        data: relatedLaws.flatMap((l, i) => [
          [i, 0, (l.agree / l.count) * 100],
          [i, 1, (l.disagree / l.count) * 100],
        ]),
        dataLabels: { enabled: true, format: "{point.value:.1f}%" },
      },
    ],
    credits: { enabled: false },
  };

  return (
    <>
    <h2
        style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        className="text-3xl text-center text-neutral-700"
      >
        입법 수요 분석
      </h2>
       <p className="text-neutral-500 mt-2 text-sm text-center mb-12">
          여론이 시간에 따라 어떻게 바뀌었는가를 나타냅니다.
        </p>
    <div className="w-full bg-[#EEE7DA]/40 rounded-3xl shadow-lg p-10">
      

      {/* 반원 도넛 + 바 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 shadow-sm gap-8 bg-white rounded-2xl p-6">
        <HighchartsReact highcharts={Highcharts} options={pieOptions} />
        <HighchartsReact highcharts={Highcharts} options={barOptions} />
      </div>

      {/* 히트맵 */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
        <HighchartsReact highcharts={Highcharts} options={heatmapOptions} />
      </div>
    </div>
</>
  );
}

// ✅ 헬퍼 함수
function extractRelatedLaws(socialTimeline: any) {
  const laws: { name: string; count: number; agree: number; disagree: number }[] = [];

  for (const dateKey of Object.keys(socialTimeline || {})) {
    const entry = socialTimeline[dateKey];
    if (!entry?.중분류목록) continue;

    for (const [_, midValue] of Object.entries(entry.중분류목록)) {
      for (const [__, subValue] of Object.entries((midValue as any).소분류목록)) {
        const val = subValue as any;
        laws.push({
          name: val.관련법,
          count: val.count || 0,
          agree: val.counts?.찬성 || 0,
          disagree: val.counts?.반대 || 0,
        });
      }
    }
  }

  // ✅ 같은 법명끼리 병합
  const merged = Object.values(
    laws.reduce((acc: any, cur) => {
      if (!acc[cur.name]) acc[cur.name] = { ...cur };
      else {
        acc[cur.name].count += cur.count;
        acc[cur.name].agree += cur.agree;
        acc[cur.name].disagree += cur.disagree;
      }
      return acc;
    }, {})
  );

  // ✅ 언급량 기준 정렬 후 상위 6개만
  return merged.sort((a: any, b: any) => b.count - a.count).slice(0, 6);
}
