'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const default_colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];

interface GraphCardProps {
  title: string;
  data: {
    [date: string]: {
      count: number;
    };
  };
  color?:string[];
}



export default function GraphCard({ title, data, color }: GraphCardProps) {
  const router = useRouter();

  // 데이터 변환
  const chartData = Object.entries(data).map(([date, value]) => ({
    date,
    count: value.count,
  }));

 // 날짜 클릭 이벤트 핸들러
  const handleBarClick = (data: any) => {
  if (data?.payload?.date) {
    // 날짜를 YYYY-MM-DD -> YYYYMMDD 형식으로 변환
    const formattedDate = data.payload.date.replace(/-/g, '');

    // 워드클라우드 있는 상세페이지로 이동 (예시: /detail/20250101)
    router.push(`/detail/${formattedDate}`);
  }
};


  return (
    <div className="bg-white p-4 rounded-lg w-full">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-700 mb-10">
        {title}
      </h2>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: '12px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar
              dataKey="count"
              fill={(color || default_colors)[0]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              onClick={handleBarClick}
              cursor="pointer" // 마우스가 올때 포인터 표시
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
