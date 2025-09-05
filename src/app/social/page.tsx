'use client';

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];

type LawData = Record<
  string,
  {
    news: Record<
      string,
      {
        count: number;
        article: {
          title: string;
          content: string;
        }[];
      }
    >;
    social: Record<string, number>;
  }
>;

export default function LawPieCharts() {
  const [data, setData] = useState<LawData | null>(null);
  const [hoveredDetail, setHoveredDetail] = useState<{
    topic: string;
    source: string;
    details: Record<string, number>;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetch('/law_data.json')
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-gray-700 font-sans">Loading...</p>;

  const selectedTopics = [
    '개인정보보호법',
    '아동복지법',
    '자본시장법',
    '중대재해처벌법',
  ];

  return (
    <div className="text-gray-800 bg-gray-50 min-h-screen py-10 px-20 font-sans">
      <h2 className="text-xl font-bold text-center mb-10">
        법안별 소셜 언급 비율
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center max-w-5xl mx-auto">
        {selectedTopics.map((topic) => {
          const topicData = data[topic];
          if (!topicData) return null;

          const chartData = Object.entries(topicData.social).map(
            ([source, count]) => ({
              name: source,
              value: count,
            })
          );

          return (
            <div
              key={topic}
              style={{ width: 300, height: 300 }}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-center mb-2 text-gray-800 font-semibold">
                {topic}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  onMouseLeave={() => setHoveredDetail(null)}
                  onMouseMove={(e: any) => {
                    if (hoveredDetail) {
                      setHoveredDetail((prev) => prev && {
                        ...prev,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                  }}
                >
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                    onMouseEnter={(_, index, e) => {
                      const source = chartData[index].name;

                      const fakeDetails = {
                        찬성: Math.floor(Math.random() * 50),
                        반대: Math.floor(Math.random() * 50),
                        중립: Math.floor(Math.random() * 50),
                      };

                      setHoveredDetail({
                        topic,
                        source,
                        details: fakeDetails,
                        x: e?.clientX ?? 0,
                        y: e?.clientY ?? 0,
                      });
                    }}
                  >
                    {chartData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f9f9f9',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      fontFamily: 'sans-serif',
                      fontSize: 16,
                      color: '#333',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      fontSize: 12,
                      color: '#555',
                      fontFamily: 'sans-serif',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>

      {/* 📌 Hover 정보 박스 */}
      {hoveredDetail && (
        <div
          className="absolute border border-gray-300 rounded shadow p-3 z-50 text-sm w-64 pointer-events-none bg-gray-100 text-gray-800 font-sans"
          style={{
            top: hoveredDetail.y + 10,
            left: hoveredDetail.x + 10,
            position: 'fixed',
          }}
        >
          <h4 className="font-semibold mb-2">
            [{hoveredDetail.topic}] {hoveredDetail.source} 세부 의견
          </h4>
          <ul>
            {Object.entries(hoveredDetail.details).map(([label, value]) => (
              <li key={label}>
                {label}: {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
