// 종합분석(핵심인사이트)에서 사용되는 line2, line3 날짜 포맷터

// ISO 주차의 월요일(UTC) 날짜
export function isoWeekToMondayUTC(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DowMon0 = (jan4.getUTCDay() + 6) % 7; // 월=0
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4DowMon0));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

// 해당 월의 몇째 주(월요일 기준, UTC)
export function weekOfMonthMondayUTC(d: Date): number {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const firstDowMon0 = (first.getUTCDay() + 6) % 7; // 월=0
  const day = d.getUTCDate();
  return Math.floor((day + firstDowMon0 - 1) / 7) + 1;
}

// 기간 라벨 + 날짜 문자열 → 표시 문자열
export function formatPeriodDate(periodLabel: string, v: string) {
  // 일별: "YYYY-MM-DD" -> "MM월DD일"
  if (/일|daily/i.test(periodLabel) && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [, mm, dd] = v.slice(5).match(/^(\d{2})-(\d{2})$/) ?? [];
    return mm && dd ? `${mm}월${dd}일` : v;
  }

  // 주별: "YYYY-W##" -> "M월 N째주"
  if (/주|weekly/i.test(periodLabel)) {
    const m = v.match(/^(\d{4})-W(\d{2})$/);
    if (m) {
      const year = Number(m[1]);
      const week = Number(m[2]);
      const monday = isoWeekToMondayUTC(year, week);
      const month = monday.getUTCMonth() + 1;
      const nth = weekOfMonthMondayUTC(monday);
      return `${month}월 ${nth}째주`;
    }
  }

  // 월별: "YYYY-MM" -> "YY년MM월"
  if (/월|monthly/i.test(periodLabel) && /^\d{4}-\d{2}$/.test(v)) {
    const yy = v.slice(2, 4);
    const mm = v.slice(5, 7);
    return `${yy}년${mm}월`;
  }

  return v;
}
