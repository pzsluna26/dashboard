// features/total/components/MentionTrendChart.tsx
"use client";

import { Group } from "@visx/group";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath, AreaClosed } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { extent } from "d3-array";
import { timeParse } from "d3-time-format";
import { PeriodKey } from "@/shared/types/common";

type TrendPoint = {
  date: string;
  news: number;
  social: number;
};

interface Props {
  data: TrendPoint[];
  period: PeriodKey;
  width?: number;
  height?: number;
}

export default function MentionTrendChart({
  data,
  period,
  width = 300,
  height = 200,
}: Props) {
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 날짜 파서 설정
  const parseDate = (date: string): Date | null => {
    const daily = timeParse("%Y-%m-%d");
    const weekly = timeParse("%Y-W%V"); // ISO 8601
    const monthly = timeParse("%Y-%m");

    if (period === "daily_timeline") return daily(date);
    if (period === "weekly_timeline") return weekly(date);
    return monthly(date);
  };

  const parsedData = data
    .map((d) => ({
      ...d,
      date: parseDate(d.date),
    }))
    .filter((d) => d.date)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  const xScale = scaleTime({
    domain: extent(parsedData, (d) => d.date!) as [Date, Date],
    range: [0, innerWidth],
  });

  const yMax = Math.max(...parsedData.map((d) => Math.max(d.news, d.social)));

  const yScale = scaleLinear({
    domain: [0, yMax * 1.2],
    range: [innerHeight, 0],
  });

  return (
    <svg width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        <AxisLeft scale={yScale} numTicks={5} />

        <AxisBottom
          scale={xScale}
          top={innerHeight}
          tickFormat={(d) => {
            const date = d as Date;
            if (period === "daily_timeline") return `${date.getMonth() + 1}/${date.getDate()}`;
            if (period === "weekly_timeline") return `${date.getMonth() + 1}월 ${date.getDate()}일`;
            return `${date.getMonth() + 1}월`;
          }}
        />

        <AreaClosed
          data={parsedData}
          x={(d) => xScale(d.date!)}
          y={(d) => yScale(d.news)}
          yScale={yScale}
          stroke="#5E936C"
          fill="#5E936C"
          fillOpacity={0.2}
          curve={curveMonotoneX}
        />

        <LinePath
          data={parsedData}
          x={(d) => xScale(d.date!)}
          y={(d) => yScale(d.news)}
          stroke="#5E936C"
          strokeWidth={2}
          curve={curveMonotoneX}
        />

        <AreaClosed
          data={parsedData}
          x={(d) => xScale(d.date!)}
          y={(d) => yScale(d.social)}
          yScale={yScale}
          stroke="#93DA97"
          fill="#93DA97"
          fillOpacity={0.2}
          curve={curveMonotoneX}
        />

        <LinePath
          data={parsedData}
          x={(d) => xScale(d.date!)}
          y={(d) => yScale(d.social)}
          stroke="#93DA97"
          strokeWidth={2}
          curve={curveMonotoneX}
        />
      </Group>
    </svg>
  );
}
