// 종합분석(KPI)

"use client";
import Image from "next/image";
import { LAW_LABEL } from "@/shared/constants/labels";

type KPIProps = {
  data: {
    name: string;
    value: number;
    growthRate: number;
    socialTotal: number;
  }[];
  period: string;
};

export default function KPISection({ data, period }: KPIProps) {
  return (
    <div className="text-neutral-700">
      <div className="flex items-center mb-4 gap-2">
        <h3 className="text-2xl font-semibold">전체 법안 요약 지표 ({period}별)</h3>
        <Image
          src="/icons/info.png"
          alt="도움말"
          width={24}
          height={24}
          title={`전체 법안들의 데이터 중 가장 최근 (${period}별) 기사량, 소셜 언급량, 전 기간 대비 기사 수 증감률 정보를 요약한 지표입니다.
                  [증감률 계산 안내]
                  • 전 기간 대비 기사 수 증감률(%)을 계산합니다.
                  • 전 기간 기사 수가 5건 미만일 경우, 증감률은 0%로 표시됩니다.
                  • 계산된 증감률이 500%를 초과할 경우, 최대 500%로 제한됩니다.`}
          className="object-contain cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex flex-col p-4 bg-transparent rounded-4xl"
          >
            {/* 법안명 */}
            <h4 className="font-semibold text-2xl mb-3">
              {LAW_LABEL[item.name as keyof typeof LAW_LABEL] ?? item.name}
            </h4>

            {/* 기사 총량 */}
            <div className="flex font-bold text-xs justify-between items-center">
              <div>
                <span className="text-4xl align-baseline">
                  {Number(item.value).toLocaleString()} / {Number(item.socialTotal).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 증감률 */}
            <p className="flex font-bold text-xs justify-between items-center mt-1">
              <span>전{period} 대비 증감률</span>
              <span
                className={`text-end text-sm ${item.growthRate >= 0 ? "text-green-500" : "text-red-500"
                  }`}
              >
                {item.growthRate >= 0 ? "▲" : "▼"} {item.growthRate.toFixed(1)}%
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
