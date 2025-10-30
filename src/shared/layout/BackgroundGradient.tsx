"use client";

import { memo } from "react";
import clsx from "clsx";

type BackgroundGradientProps = {
  className?: string;
  /** 라디얼 하이라이트(은은한 포인트) 표시 여부 */
  highlights?: boolean;
  /** 글래스 느낌(화이트 반투명 레이어) 표시 여부 */
  glass?: boolean;
  /** 위→아래 4단 그라데이션 색상 */
  stops?: [string, string, string, string];
};

/**
 * 화면 전체에 고정되는 배경 레이어
 * - 기본: #ced7dc → #eaebed → #f6efec → #f8e7e0
 * - pointer-events: none (클릭 가로막지 않음)
 */
function BackgroundGradient({
  className,
  highlights = true,
  glass = true,
  stops = ["#ced7dc", "#eaebed", "#f6efec", "#f8e7e0"],
}: BackgroundGradientProps) {
  const [c1, c2, c3, c4] = stops;

  return (
    <div className={clsx("fixed -inset-2 -z-10 pointer-events-none", className)}>
      {/* 4단 선형 그라데이션 (inline style로 안전 적용) */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${c1} 0%, ${c2} 33%, ${c3} 66%, ${c4} 100%)`,
        }}
      />

      {/* (옵션) 은은한 라디얼 하이라이트 */}
      {highlights && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(620px_320px_at_18%_15%,rgba(111,145,232,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(760px_420px_at_85%_82%,rgba(151,170,214,0.12),transparent_62%)]" />
        </>
      )}

      {/* (옵션) 글래스 느낌 + 살짝 블러 */}
      {glass && <div className="absolute inset-0 bg-white/8" />}
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  );
}

export default memo(BackgroundGradient);
