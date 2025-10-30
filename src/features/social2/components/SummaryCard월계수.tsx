"use client";

import React from "react";
import { LAW_LABEL } from "@/shared/constants/labels";
import LaurelCard from "./LaurelCard";

interface SummaryCardProps {
  slug: string;
  socialData: any;
}

export default function SummaryCard({ slug, socialData }: SummaryCardProps) {
  const midList = Object.values(socialData?.["중분류목록"] || {});

  let prosTotal = 0;
  let consTotal = 0;
  let strengthenTotal = 0;
  let weakenTotal = 0;

  midList.forEach((mid: any) => {
    const subList = Object.values(mid?.["소분류목록"] || {});
    subList.forEach((sub: any) => {
      const counts = sub?.counts || {};
      prosTotal += counts["찬성"] || 0;
      consTotal += counts["반대"] || 0;
      strengthenTotal += sub?.찬성?.개정강화?.count || 0;
      weakenTotal += sub?.찬성?.폐지약화?.count || 0;
    });
  });

  const totalCount = prosTotal + consTotal;
  const proRatio = totalCount > 0 ? (prosTotal / totalCount) * 100 : 0;
  const conRatio = totalCount > 0 ? (consTotal / totalCount) * 100 : 0;
  const strengthenRatio = prosTotal > 0 ? (strengthenTotal / prosTotal) * 100 : 0;
  const weakenRatio = prosTotal > 0 ? (weakenTotal / prosTotal) * 100 : 0;

  return (
    <div className="w-full flex flex-col items-center mt-16 mb-10">
      {/* 상단 타이틀 */}
      <div className="text-center mb-10">
        <h4 className="text-sm text-neutral-400 mb-2">
          법안명: {LAW_LABEL[slug]}
        </h4>
        <h2
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
          className="text-4xl text-neutral-800"
        >
          여론 요약 지표
        </h2>
        <p className="text-neutral-500 mt-2 text-sm">
          여론 데이터를 기반으로 종합 요약된 정보를 제공합니다.
        </p>
      </div>

      {/* 카드 그룹 */}
      <div className="flex justify-center items-center flex-wrap gap-6">
        <LaurelCard
          label="총 언급량"
          value={`${totalCount.toLocaleString()}건`}
        />
        <LaurelCard
          label="찬성 비율"
          value={`${proRatio.toFixed(1)}%`}
          subtitle={`개정강화 ${strengthenRatio.toFixed(1)}%, 폐지약화 ${weakenRatio.toFixed(1)}%`}
        />
        <LaurelCard
          label="반대 비율"
          value={`${conRatio.toFixed(1)}%`}
          subtitle={`총 ${consTotal.toLocaleString()}건`}
        />
      </div>
    </div>
  );
}
