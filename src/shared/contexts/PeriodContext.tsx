"use client";
import { createContext, useContext } from "react";
import type { PeriodKey } from "@/shared/types/common";

type Ctx = {
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  apiPeriod: "daily" | "weekly" | "monthly";
};

export const PERIOD_API_MAP = {
  daily_timeline: "daily",
  weekly_timeline: "weekly",
  monthly_timeline: "monthly",
} as const;

const PeriodContext = createContext<Ctx | null>(null);

export const usePeriod = () => {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within <PeriodProvider />");
  return ctx;
};

export function PeriodProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: { period: PeriodKey; setPeriod: (p: PeriodKey) => void };
}) {
  const apiPeriod = PERIOD_API_MAP[value.period];
  return (
    <PeriodContext.Provider value={{ ...value, apiPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}
