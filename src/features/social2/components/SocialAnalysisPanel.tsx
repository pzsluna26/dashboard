"use client";

import { useMemo, useState } from "react";
import type { Sentiment } from "@/shared/types/common";
import type { SocialTimeline } from "@/features/news/components/NivoTrendChart/types";

import {
  useSortedDates,
  useSocialSeries,
  useInitSocialSelection,
} from "@/features/news/components/NivoTrendChart/hooks";

import LineChart from "@/features/news/components/NivoTrendChart/LineChart";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

type Props = {
  socialData?: SocialTimeline;
  periodLabel?: string;
  defaultDate?: string;
};

type DetailData = {
  title: string;
  content?: string;
  channel?: string;
  count?: number;
  date?: string;
};

export default function SocialAnalysisPanel({
  socialData,
  periodLabel,
  defaultDate,
}: Props) {
  const sortedDates = useSortedDates(undefined, socialData);
  const series = useSocialSeries(socialData, sortedDates);

  const [socialDetail, setSocialDetail] = useState<{
    date: string;
    sentiment: Sentiment;
  } | null>(null);

  const { socialDate } = useInitSocialSelection(
    "social",
    socialData,
    sortedDates,
    (date, sentiment) => setSocialDetail({ date, sentiment })
  );

  const [modalData, setModalData] = useState<DetailData | null>(null);

  const selectedDate = useMemo(() => {
    const date = socialDetail?.date ?? socialDate ?? defaultDate;
    if (date && socialData?.[date]) return date;
    return sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
  }, [socialDetail, socialDate, defaultDate, sortedDates, socialData]);

  const current = selectedDate ? socialData?.[selectedDate] : null;
  const 채널리스트 = ["blog", "twitter", "community", "insta"];

  // ✅ 수치 계산
  const 강화 = useMemo(() => {
    if (!current) return 0;
    let count = 0;
    for (const mid of Object.values(current.중분류목록 || {}))
      for (const sub of Object.values(mid.소분류목록 || {}))
        count += sub?.찬성?.개정강화?.count || 0;
    return count;
  }, [current]);

  const 완화 = useMemo(() => {
    if (!current) return 0;
    let count = 0;
    for (const mid of Object.values(current.중분류목록 || {}))
      for (const sub of Object.values(mid.소분류목록 || {}))
        count += sub?.찬성?.폐지약화?.count || 0;
    return count;
  }, [current]);

  const 반대 = current?.counts?.["반대"] || 0;
  const 찬성 = 강화 + 완화;

  // ✅ 반대 채널 분포
  const 반대채널 = useMemo(() => {
    if (!current) return [];
    const map: Record<string, number> = {};
    for (const c of 채널리스트) map[c] = 0;
    for (const mid of Object.values(current.중분류목록 || {}))
      for (const sub of Object.values(mid.소분류목록 || {}))
        for (const g of sub?.반대?.소셜목록 || [])
          map[g.channel] = (map[g.channel] || 0) + 1;
    return Object.entries(map).map(([name, y]) => ({ name, y }));
  }, [current]);

  // ✅ 찬성 채널 분포
  const 찬성채널 = useMemo(() => {
    if (!current) return [];
    const map: Record<string, number> = {};
    for (const c of 채널리스트) map[c] = 0;
    for (const mid of Object.values(current.중분류목록 || {}))
      for (const sub of Object.values(mid.소분류목록 || {})) {
        for (const g of sub?.찬성?.개정강화?.소셜목록 || [])
          map[g.channel] = (map[g.channel] || 0) + 1;
        for (const g of sub?.찬성?.폐지약화?.소셜목록 || [])
          map[g.channel] = (map[g.channel] || 0) + 1;
      }
    return Object.entries(map).map(([name, y]) => ({ name, y }));
  }, [current]);

  // ✅ 도넛 차트 옵션
  const hybridDonut = useMemo(() => {
    const inner = [
      { name: "찬성", y: 찬성, color: "#88AB8E" },
      { name: "반대", y: 반대, color: "#d6d3ca" },
    ];

    const outer = [
      { name: "개정 강화", y: 강화, color: "#AFC8AD" },
      { name: "폐지 완화", y: 완화, color: "#D8EFD3" },
      { name: "반대", y: 반대, color: "#ecebe5" },
    ];

    return {
      chart: { type: "pie", backgroundColor: "transparent", height: 300 },
      title: { text: null },
      tooltip: { headerFormat: "", pointFormat: "<b>{point.name}</b>: {point.y}건" },
      plotOptions: { pie: { shadow: false, center: ["50%", "50%"] } },
      series: [
        {
          name: "찬반 비율",
          data: inner,
          size: "60%",
          dataLabels: { enabled: true, distance: 8, style: { fontWeight: "bold" } },
        },
        {
          name: "세부 구성",
          data: outer,
          size: "100%",
          innerSize: "60%",
          dataLabels: { enabled: true, distance: 15, format: "<b>{point.name}</b>: {point.y}건" },
        },
      ],
    };
  }, [찬성, 반대, 강화, 완화]);

  const nestedDonut = useMemo(() => {
    const inner = [
      { name: "찬성", y: 찬성, color: "#88AB8E" },
      { name: "반대", y: 반대, color: "#d6d3ca" },
    ];

    const outer = [
      ...찬성채널.map((d, i) => ({
        name: `${d.name}`,
        y: d.y,
        color: ["#afc8ad", "#b9d3b7", "#cae8c9", "#dcf3d6"][i % 4],
      })),
      ...반대채널.map((d, i) => ({
        name: `${d.name}`,
        y: d.y,
        color: ["#e1ded6", "#ebe7de", "#f3f0e9", "#f4f2eb"][i % 4],
      })),
    ];

    return {
      chart: { type: "pie", backgroundColor: "transparent", height: 300 },
      title: { text: null },
      tooltip: { headerFormat: "", pointFormat: "<b>{point.name}</b>: {point.y}건" },
      plotOptions: { pie: { shadow: false, center: ["50%", "50%"] } },
      series: [
        {
          name: "찬반 비율",
          data: inner,
          size: "60%",
          dataLabels: { enabled: true, distance: 8, style: { fontWeight: "bold" } },
        },
        {
          name: "채널별 비율",
          data: outer,
          size: "100%",
          innerSize: "60%",
          dataLabels: { enabled: true, distance: 15 },
        },
      ],
    };
  }, [찬성, 반대, 찬성채널, 반대채널]);

  if (!current) {
    return (
      <div className="w-full py-20 text-center text-neutral-500">
        ⚠️ 해당 기간({periodLabel})에 데이터가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col mb-12">
        <h2
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
          className="text-4xl text-center"
        >
          핫이슈 사건 및 여론 동향
        </h2>
        <p className="text-neutral-500 mt-2 text-sm text-center">
          여론이 시간에 따라 어떻게 바뀌었는가를 나타냅니다.
        </p>
      </div>

      <div className="w-full bg-white rounded-4xl p-10 shadow-sm hover:shadow-lg transition-shadow duration-300">
        {/* 📈 라인차트 */}
        <div className="w-full mb-10">
          <LineChart
            view="social"
            data={series}
            yLegend="언급 수"
            periodLabel={periodLabel}
            onMaxPointClick={(date) => setSocialDetail({ date, sentiment: "찬성" })}
            height={400}
          />
        </div>

        {/* 📌 핫이슈 카드 */}
        {current && (
          <div className="mt-12 bg-[#EEE7DA]/40 rounded-2xl shadow-sm p-6">
            <h3
              style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              className="text-xl text-center mb-8 text-neutral-800"
            >
              핫이슈사건:{" "}
              {
                Object.entries(current.중분류목록 || {})
                  .flatMap(([_, mid]: any) =>
                    Object.entries(mid.소분류목록 || {}).map(([name, sub]: any) => ({
                      name,
                      count:
                        (sub.찬성?.개정강화?.count || 0) +
                        (sub.찬성?.폐지약화?.count || 0) +
                        (sub.반대?.count || 0),
                      data: sub,
                    }))
                  )
                  .sort((a, b) => b.count - a.count)[0]?.name || "데이터 없음"
              }
            </h3>

            {(() => {
              const topSub =
                Object.entries(current.중분류목록 || {})
                  .flatMap(([_, mid]: any) =>
                    Object.entries(mid.소분류목록 || {}).map(([name, sub]: any) => ({
                      name,
                      count:
                        (sub.찬성?.개정강화?.count || 0) +
                        (sub.찬성?.폐지약화?.count || 0) +
                        (sub.반대?.count || 0),
                      data: sub,
                    }))
                  )
                  .sort((a, b) => b.count - a.count)[0] || null;

              if (!topSub)
                return <p className="text-center text-neutral-400">데이터 없음</p>;

              const { data } = topSub;
              const pos1 = data.찬성?.개정강화?.소셜목록?.[0];
              const pos2 = data.찬성?.폐지약화?.소셜목록?.[0];
              const neg = data.반대?.소셜목록?.[0];

              const CardItem = ({
                title,
                info,
              }: {
                title: string;
                info?: any;
              }) => (
                <div className="flex flex-col items-start gap-3 bg-[#FAFAFA] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2">
                    {info?.channel && (
                      <img
                        src={`/channel/${info.channel}.svg`}
                        alt={info.channel}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <p style={{ fontFamily: "'Black Han Sans', sans-serif" }}
                      className="text-neutral-700 text-base">{title}</p>
                  </div>
                  <p className="text-neutral-600 text-sm leading-relaxed line-clamp-4">
                    {info?.content || "의견 데이터 없음"}
                  </p>
                  <button
                    onClick={() =>
                      setModalData({
                        title,
                        content: info?.content,
                        channel: info?.channel,
                        count: info?.count,
                        date: info?.date,
                      })
                    }
                    className="mt-2 text-sm text-[#88AB8E] hover:underline self-end"
                  >
                    더보기
                  </button>
                </div>
              );

              return (
                <div className="grid grid-cols-3 gap-6">
                  <CardItem title="찬성 - 개정강화" info={pos1} />
                  <CardItem title="찬성 - 폐지완화" info={pos2} />
                  <CardItem title="반대" info={neg} />
                </div>
              );
            })()}
          </div>
        )}

        {/* 📊 하단 차트 */}
        <div className="flex gap-6 mt-6">
          <div className="w-1/2 bg-[#EEE7DA]/40 rounded-xl p-6 shadow-sm">
            <h3
              style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              className="text-xl text-neutral-700 mb-4 text-center"
            >
              찬성/반대 비율 및 세부 의견
            </h3>
            <div className="bg-white rounded-xl shadow p-2">
              <HighchartsReact highcharts={Highcharts} options={hybridDonut} />
            </div>
          </div>

          <div className="w-1/2 bg-[#EEE7DA]/40 rounded-xl p-6 shadow-sm">
            <h3
              style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              className="text-xl text-neutral-700 mb-4 text-center"
            >
              채널 비율
            </h3>
            <div className="bg-white rounded-xl shadow p-2">
              <HighchartsReact highcharts={Highcharts} options={nestedDonut} />
            </div>
          </div>
        </div>
      </div>

      {/* 🪟 모달 */}
      {modalData && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModalData(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-[500px] shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-4 text-neutral-400 text-xl hover:text-neutral-600"
              onClick={() => setModalData(null)}
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-neutral-800">
              {modalData.title}
            </h3>
            <p className="text-sm text-neutral-500 mb-2">
              <b>채널:</b> {modalData.channel || "정보 없음"}
            </p>
            <p className="text-sm text-neutral-500 mb-2">
              <b>날짜:</b> {modalData.date || "정보 없음"}
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              <b>Count:</b> {modalData.count ?? "정보 없음"}
            </p>
            <div className="bg-[#F9F9F9] p-4 rounded-xl">
              <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {modalData.content || "내용이 없습니다."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
