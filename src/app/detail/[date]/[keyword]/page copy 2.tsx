'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Article {
  title: string;
  content: string;
}

interface NewsData {
  [date: string]: {
    keywords: string[];
    articles: Article[];
  };
}

export default function ArticleDetailPage() {
  const { keyword, date } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keyword || !date) return;

    const fetchArticles = async () => {
      try {
        const keywordStr = decodeURIComponent(Array.isArray(keyword) ? keyword[0] : keyword);
        const dateStr = Array.isArray(date) ? date[0] : date;

        const res = await fetch('/data.json');
        const jsonData = await res.json();

        // JSON 내 날짜별 뉴스 데이터 접근
        const newsData: NewsData = jsonData['개인정보보호법']?.news || {};
        const entry = newsData[dateStr];

        if (!entry) {
          setArticles([]);
          setLoading(false);
          return;
        }

        // 키워드가 포함되어 있는 기사 필터링
        const filtered = entry.articles.filter((article) =>
          article.title.includes(keywordStr) ||
          article.content.includes(keywordStr)
        );

        setArticles(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching article:', err);
        setArticles([]);
        setLoading(false);
      }
    };

    fetchArticles();
  }, [keyword, date]);

  if (loading) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="bg-gray-50 rounded-xl p-8 max-w-4xl mx-auto min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        "{decodeURIComponent(keyword as string)}" 관련 기사 ({date})
      </h1>
      <div className='w-full flex gap-2'>
      {articles.length === 0 ? (
        <p className="text-gray-500">관련 기사를 찾을 수 없습니다.</p>
      ) : (
        articles.map((article, idx) => (
          <div key={idx} className="w-full mb-8 p-4 border border-gray-300 rounded bg-white shadow">
            <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
            <p className="text-sm text-gray-700">{article.content}</p>
          </div>
        ))
      )}
      </div>
    </div>
  );
}
