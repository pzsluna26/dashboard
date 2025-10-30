// 좌측 메뉴영역 네비게이션

import type { Category } from "@/shared/types/common";

// 뉴스용 카테고리
export const CATEGORIES: Category[] = [
  { key: "종합분석", name: "종합분석", image: "/icons/main.png", activeImage: "/icons/mainw.png", href: "/" },
  { key: "privacy", name: "개인정보보호법", image: "/icons/privacy.png", activeImage: "/icons/privacyw.png", href: "/news/category/privacy" },
  { key: "child", name: "아동복지법", image: "/icons/child.png", activeImage: "/icons/childw.png", href: "/news/category/child" },
  { key: "finance", name: "자본시장법", image: "/icons/finance.png", activeImage: "/icons/financew.png", href: "/news/category/finance" },
  { key: "safety", name: "중대재해처벌법", image: "/icons/safety.png", activeImage: "/icons/safetyw.png", href: "/news/category/safety" },
];

// 소셜용 카테고리
export const CATEGORIES_SOCIAL: Category[] = [
  {
    key: "privacy", name: "개인정보보호 인식",
    image: "/icons/privacy.png",
    activeImage: "/icons/privacyw.png",
    href: "/social/category/privacy",
  },
  {
    key: "child",
    name: "아동권리 인식",
    image: "/icons/child.png",
    activeImage: "/icons/childw.png",
    href: "/social/category/child",
  },
  {
    key: "finance",
    name: "금융 인식",
    image: "/icons/finance.png",
    activeImage: "/icons/financew.png",
    href: "/social/category/finance",
  },
  {
    key: "safety",
    name: "안전 관련 인식",
    image: "/icons/safety.png",
    activeImage: "/icons/safetyw.png",
    href: "/social/category/safety",
  },
];