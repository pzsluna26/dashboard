"use client";

import React from "react";
import { LAW_LABEL } from "@/shared/constants/labels";
import Image from "next/image";

interface SummaryCardProps {
    slug: string;
    socialData: any;
}

export default function SummaryCard({
    slug,
    socialData,
}: SummaryCardProps) {
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
        <div className="w-full flex flex-col items-center">
            {/* 상단 타이틀 */}
            <div className="text-center">
                <h4 className="text-sm text-neutral-400 mb-2">법안명: {LAW_LABEL[slug]}</h4>
                {/* <div className="flex">
                    <Image
                        src="/icons/openquote.png"
                        alt="open quote"
                        width={40}
                        height={40}
                        className="inline-block"
                    /> */}
                    <h2
                        style={{ fontFamily: "'Black Han Sans', sans-serif" }}
                        className="text-4xl text-neutral-800 "
                    >
                        여론 요약 지표
                    </h2>
                    {/* <Image
                        src="/icons/closequote.png"
                        alt="close quote"
                        width={40}
                        height={40}
                        className="inline-block"
                    />
                </div> */}
                <p className="text-neutral-500 mt-2 text-sm">
                    여론 데이터를 기반으로 종합 요약된 정보를 제공합니다.
                </p>
            </div>

            {/* 카드 그룹 */}
            <div className=" p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-7 w-full max-w-4xl">
                {/* 카드 1 */}
                <div className="bg-white rounded-xl transition-transform hover:scale-105 p-6 flex flex-col items-center text-center">
                    {/* <img
                        // src="/article/slug3-1.jpg"
                        src="/icons/social1.svg"
                        alt="총 소셜 언급량"
                        className="w-10 h-10 mb-4"
                    /> */}
                    <h3  style={{ fontFamily: "'Black Han Sans', sans-serif" }}className="text-lg  text-neutral-700 mb-2">
                        총 소셜 언급량
                    </h3>
                    <p style={{ fontFamily: "'Black Han Sans', sans-serif" }}className="text-6xl text-[#A2AADB]">
                        {totalCount.toLocaleString()}건
                    </p>
                </div>

                {/* 카드 2 */}
                <div className="bg-white rounded-xl transition-transform hover:scale-105 p-6 flex flex-col items-center text-center">
                    {/* <img
                        // src="/article/slug3-2.jpg"
                        src="/icons/social2.svg
                        alt="찬성 비율"
                        className="w-8 h-8 mb-4"
                    /> */}
                    <h3  style={{ fontFamily: "'Black Han Sans', sans-serif" }}className="text-lg  text-neutral-700 mb-2">찬성 비율</h3>
                    <p style={{ fontFamily: "'Black Han Sans', sans-serif" }} className="text-6xl text-[#8AA624]">
                        {proRatio.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {prosTotal > 0
                            ? `개정강화 ${strengthenRatio.toFixed(1)}%, 폐지약화 ${weakenRatio.toFixed(1)}%`
                            : "관련 데이터 없음"}
                    </p>
                </div>

                {/* 카드 3 */}
                <div className="bg-white rounded-xl transition-transform hover:scale-105 p-6 flex flex-col items-center text-center">
                    {/* <img
                        // src="/article/slug3-3.jpg"
                        src="/icons/social3.svg"
                        alt="반대 비율"
                        className="w-10 h-10 mb-4"
                    /> */}
                    <h3  style={{ fontFamily: "'Black Han Sans', sans-serif" }}className="text-lg  text-neutral-700 mb-2">반대 비율</h3>
                    <p style={{ fontFamily: "'Black Han Sans', sans-serif" }} className="text-6xl text-[#F16767]">
                        {conRatio.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        총 {consTotal.toLocaleString()}건
                    </p>
                </div>
            </div>
        </div>
    );
}
