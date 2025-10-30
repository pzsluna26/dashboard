// types

// 기간 키 & 라벨
export type PeriodKey = "daily_timeline" | "weekly_timeline" | "monthly_timeline";
export type PeriodLabel = "일" | "주" | "월";

// 카테고리 키
export type CategoryKey = "privacy" | "child" | "safety" | "finance";

// 소셜 감성
export type Sentiment = "찬성" | "반대";

// 루트 탭 (종합분석 포함)
export type RootTab = "종합분석" | CategoryKey;

// 좌측 네비게이션에 쓰는 카테고리 아이템
export type Category = {
  key: RootTab;
  name: string;
  image: string;
  activeImage: string;
  href: string;
};



// KPI/랭킹에서 재사용하는 카드 아이템
export type KpiItem = {
  name: CategoryKey;
  value: number;
  growthRate: number;
  socialTotal: number;
  rawSocial?: Record<Sentiment, number>;
};


// 상세분석
export type Detail = {
  mid: string;
  sub?: { title: string };
  article?: { title: string; url: string; content: string };
  count?: number;
};