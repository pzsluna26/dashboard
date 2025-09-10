'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc']; // 찬성, 반대, 중립

interface LawOpinionPieProps {
  social: Record<string, number>; // ✅ 이제 이거만 받는다
}

export default function LawOpinionPie({ social }: LawOpinionPieProps) {
  // 🔸 데이터가 없을 경우 처리
  if (!social) {
    return <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>;
  }

  const order = ['찬성', '반대', '중립'];
  const chartData = order.map((key) => ({
    name: key,
    value: social[key] || 0,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ name, percent }) =>
              `${name} ${(percent! * 100).toFixed(0)}%`
            }
          >
            {chartData.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              fontSize: 12,
              fontFamily: 'sans-serif',
              borderRadius: 4,
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              fontSize: 12,
              fontFamily: 'sans-serif',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
