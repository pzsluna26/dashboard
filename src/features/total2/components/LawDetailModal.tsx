"use client";

import { FC } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getPieChartData, getChannelBarData } from "@/features/total/components/utils/chartUtils";

interface LawDetailModalProps {
  open: boolean;
  onClose: () => void;
  category: string;
  details: any;
}

const LawDetailModal: FC<LawDetailModalProps> = ({ open, onClose, category, details }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="relative bg-white rounded-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg p-8"
        onClick={(e) => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button onClick={onClose}
          className="absolute top-3 right-4 text-neutral-400 hover:text-neutral-600 transition">
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* 제목 */}
        <h2 className="text-2xl mb-6 text-center text-neutral-800"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
          상세 분석
        </h2>

        {/* 본문 */}
        <div className="space-y-6">
          {Object.entries(details.중분류목록 || {}).map(([midKey, midVal]: [string, any]) => (
            <div key={midKey}>
              <h3 className="text-lg font-semibold text-[#444] border-l-4 border-blue-400 pl-2 mb-2">
                {midKey}
              </h3>

              <div className="space-y-4">
                {Object.entries(midVal.소분류목록 || {}).map(([subKey, subVal]: [string, any]) => (
                  <div
                    key={subKey}
                    className="border border-gray-200 rounded-lg p-5 bg-gray-50 hover:shadow-md transition space-y-4"
                  >
                    {/* 소제목 */}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {subKey}
                      </p>
                      <p className="text-sm text-gray-600">
                        관련법: {subVal.관련법}
                      </p>
                      <p className="text-sm text-gray-600">
                        총 {subVal.count.toLocaleString()}건 (찬성 {subVal.counts.찬성}, 반대{" "}
                        {subVal.counts.반대})
                      </p>
                    </div>

                    {/* 차트들 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 도넛 차트 */}
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getPieChartData(subVal)}
                              dataKey="value"
                              innerRadius={40}
                              outerRadius={60}
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {getPieChartData(subVal).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 바 차트 */}
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getChannelBarData(subVal)}>
                            <XAxis dataKey="name" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#88AB8E" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 소셜 미리보기 */}
                    <div>
                      <p className="text-xs font-semibold text-blue-700 mb-2">
                        💬 소셜 반응 예시
                      </p>

                      <div className="space-y-3">
                        {(subVal.찬성?.개정강화?.소셜목록 || []).slice(0, 2).map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="relative bg-white border border-blue-100 rounded-xl shadow-sm p-4"
                          >
                            <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-blue-100"></div>

                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wide">
                                {s.channel}
                              </span>
                            </div>

                            <p className="text-sm text-gray-700 leading-relaxed">
                              {s.content.slice(0, 100)}...
                            </p>
                          </div>
                        ))}

                        {!(subVal.찬성?.개정강화?.소셜목록?.length > 0) && (
                          <p className="text-xs text-gray-500 italic">소셜 반응 없음</p>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LawDetailModal;
