// components/ui/InfoTooltip.tsx
"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import Image from "next/image";

type InfoTooltipProps = {
  children: React.ReactNode; // 툴팁에 표시될 내용
  iconSize?: number;         // 아이콘 크기 조절
  side?: "top" | "right" | "bottom" | "left"; // 툴팁 위치
  className?: string;        // 트리거 버튼 클래스
};

export default function InfoTooltip({
  children,
  iconSize = 22,
  side = "top",
  className,
}: InfoTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className={`p-1 hover:scale-105 transition-transform ${className ?? ""}`}
            aria-label="정보 보기"
          >
            <Image
              src="/icons/info.png"
              alt="도움말"
              width={iconSize}
              height={iconSize}
              className="object-contain"
            />
          </button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={8}
            className="z-50 max-w-md rounded-xl bg-white/95 border border-gray-200 
                       px-4 py-3 text-sm leading-relaxed text-neutral-700 
                       shadow-xl backdrop-blur-sm"
          >
            {children}
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
