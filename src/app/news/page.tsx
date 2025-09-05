"use client";

import GraphCard from "@/components/graphCard";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Article {
  title: string;
  content: string;
}

interface NewsDayData {
  count: number;
  articles: Article[];
}

interface NewsData {
  [date: string]: NewsDayData;
}

interface SocialData {
  blog: number;
  community: number;
  twitter: number;
  insta: number;
}

interface LawCategoryData {
  news: NewsData;
  social: SocialData;
}

interface LawData {
  [category: string]: LawCategoryData;
}

export default function NewsPage() {
  const [data, setData] = useState<LawData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/law_data.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("데이터 로딩 실패:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">로딩 중...</p>;
  if (!data) return <p className="p-4 text-red-500">데이터를 불러오지 못했습니다.</p>;

  const categories = Object.keys(data);

  return (
    <main className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-xl font-bold  mb-6 text-center text-gray-700">
        카테고리별 뉴스 카운트
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-gray-700">
        {categories.map((category) => (
          <GraphCard
            key={category}
            title={category}
            data={data[category].news}
          />
        ))}
      </div>
    </main>
  );
}
