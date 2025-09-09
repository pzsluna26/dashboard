'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Article {
  title: string;
  content: string;
}

export default function ArticleDetailPage() {
  const { keyword, date } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keyword || !date) return;

    const fetchArticles = async () => {
      const keywordStr = Array.isArray(keyword) ? keyword[0] : keyword;
      const res = await fetch(
        `/api/articles?keyword=${encodeURIComponent(keywordStr)}&date=${date}`
      );
      const data = await res.json();
      setArticles(data);
      setLoading(false);
    };

    fetchArticles();
  }, [keyword, date]);

  if (loading) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        "{decodeURIComponent(keyword as string)}" 관련 기사 ({date})
      </h1>

      {articles.length === 0 ? (
        <p className="text-gray-500">관련 기사를 찾을 수 없습니다.</p>
      ) : (
        articles.map((article, idx) => (
          <div key={idx} className="mb-8 p-4 border border-gray-300 rounded">
            <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
            <p className="text-sm text-gray-700">{article.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
