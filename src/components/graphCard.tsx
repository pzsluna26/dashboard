'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type KeywordTrendChartProps = {
  slug: string;
};

const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

// slug → 한글 이름 매핑 (CategoryPage와 동일하게 맞추는 게 좋아요)
const displayNameMap: Record<string, string> = {
  privacy: '개인정보보호법',
  finance: '자본시장법',
  child: '아동복지법',
  safety: '중대재해처벌법',
};

export default function KeywordTrendChart({ slug }: KeywordTrendChartProps) {
  const [lawData, setLawData] = useState<any>(null);
  const [incidentList, setIncidentList] = useState<
    { group: string; incident: string; incidentId: string }[]
  >([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching data for slug: ${slug}`);
        const res = await fetch(`http://10.125.121.217:8080/api/news/category/${slug}`);
        const json = await res.json();

        console.log('Received JSON:', json);

        const lawSection = json[slug];

        if (!lawSection) {
          console.warn(`법률 섹션(${slug}) 데이터가 없습니다.`);
          return;
        }

        const groupMap = lawSection.incident_groups;
        if (!groupMap) {
          console.warn('groupMap is undefined, 데이터 구조가 예상과 다를 수 있습니다.');
          return;
        }

        const list: { group: string; incident: string; incidentId: string }[] = [];

        for (const group in groupMap) {
          for (const incident in groupMap[group]) {
            const incidentId = `${group}::${incident}`;
            list.push({ group, incident, incidentId });
          }
        }

        setLawData(groupMap);
        setIncidentList(list);

        if (list.length > 0) {
          setSelectedIncidentId(list[0].incidentId); // 첫 incident 선택
        }
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      }
    };

    fetchData();
  }, [slug]);

  if (!lawData || incidentList.length === 0) {
    return <div className="p-6 text-gray-600">로딩 중...</div>;
  }

  const [selectedGroup] = selectedIncidentId.split('::');
  const selectedGroupData = lawData[selectedGroup];

  const mergedTrend: { [keyword: string]: { [month: string]: number } } = {};

  for (const incident of Object.values(selectedGroupData)) {
    const trend = (incident as any).keyword_trend;
    for (const keyword in trend) {
      if (!mergedTrend[keyword]) {
        mergedTrend[keyword] = {};
      }
      for (const month in trend[keyword]) {
        mergedTrend[keyword][month] =
          (mergedTrend[keyword][month] || 0) + trend[keyword][month];
      }
    }
  }

  const chartData = (() => {
    if (Object.keys(mergedTrend).length === 0) return [];

    const months = Object.keys(Object.values(mergedTrend)[0] || {}).sort();

    return months.map((month) => {
      const row: { [key: string]: any } = { month };
      for (const keyword in mergedTrend) {
        row[keyword] = mergedTrend[keyword][month] ?? 0;
      }
      return row;
    });
  })();

  return (
    <div className="flex flex-col md:flex-row gap-6 rounded-2xl">
      {/* 사건 목록 */}
      <div className="w-full md:w-1/4 bg-white p-4 rounded-xl shadow">
        <h3 className="font-bold text-gray-700 mb-4">사건 목록 (소분류)</h3>
        <ul className="space-y-2">
          {incidentList.map(({ group, incident, incidentId }) => (
            <li key={incidentId}>
              <button
                onClick={() => setSelectedIncidentId(incidentId)}
                className={`w-full text-left px-3 py-2 rounded-md ${selectedIncidentId === incidentId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {incident}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 키워드 선그래프 */}
      <div className="w-full md:w-3/4 bg-white p-4 rounded-xl shadow">
        <h3 className="text-center text-lg font-semibold text-gray-700 mb-6">
          {selectedGroup} 키워드 추이 (2025.01 ~ 2025.08)
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="month" tickFormatter={(month) => `${month.slice(4)}월`} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(mergedTrend).map((keyword, idx) => (
                <Line
                  key={keyword}
                  type="monotone"
                  dataKey={keyword}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
