// labels

import type { CategoryKey } from "@/shared/types/common";

export const LAW_LABEL: Record<CategoryKey, string> = {
  privacy: "개인정보보호법",
  child: "아동복지법",
  safety: "중대재해처벌법",
  finance: "자본시장법",
};

export const PERIOD_LABEL_MAP = {
  daily_timeline: "일",
  weekly_timeline: "주",
  monthly_timeline: "월",
} as const;
