// 검색

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Disclosure } from '@headlessui/react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';

interface RawArticle {
  id: number;
  subid: number | null;
  category: string;
  category3: string | null;
  date: string;
  title: string;
  content: string;
  url?: string;
}

interface FlatArticle {
  law: string;
  period: string;
  media: string;
  title: string;
  content: string;
  url?: string;
  date: string;
}

const periods = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08"];
const mediaCompanies = ["조선일보", "중앙일보", "한겨레"];

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query")?.toLowerCase() || "";

  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [rawArticles, setRawArticles] = useState<RawArticle[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`http://10.125.121.213:8080/api/news/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('데이터를 가져올 수 없습니다.');
        const data = await res.json();
        setRawArticles(data);
      } catch (err) {
        console.error("오류 발생:", err);
        setRawArticles(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [query]);

  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev =>
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  const toggleMedia = (media: string) => {
    setSelectedMedia(prev =>
      prev.includes(media) ? prev.filter(m => m !== media) : [...prev, media]
    );
  };

  function extractMediaFromTitle(title: string): string {
    const mediaList = ["조선일보", "중앙일보", "한겨레"];
    const match = mediaList.find(media => title.includes(media));
    return match || "미지정";
  }

  const flatArticles = useMemo(() => {
    if (!rawArticles) return [];
    return rawArticles.map((article): FlatArticle => {
      const law = article.category;
      const period = article.date.slice(0, 7);
      const media = extractMediaFromTitle(article.title);
      return {
        law,
        period,
        media,
        title: article.title,
        content: article.content,
        url: article.url,
        date: article.date,
      };
    });
  }, [rawArticles]);

  const filteredArticles = useMemo(() => {
    if (!query) return [];
    return flatArticles.filter(article => {
      const lowerQuery = query.toLowerCase();
      const matchQuery =
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery);

      const matchPeriod =
        selectedPeriods.length === 0 || selectedPeriods.includes(article.period);

      const matchMedia =
        selectedMedia.length === 0 || selectedMedia.includes(article.media);

      return matchQuery && matchPeriod && matchMedia;
    });
  }, [flatArticles, query, selectedPeriods, selectedMedia]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextQuery = formData.get('search')?.toString().trim();
    if (nextQuery) {
      router.push(`/search?query=${encodeURIComponent(nextQuery)}`);
    }
  };

  return (
    <div className="mt-25 min-h-screen w-9/10 flex bg-gray-50/50 px-10 rounded-3xl">
      {/* 왼쪽 필터 */}
      <aside className="w-1/4 pr-6 sticky top-20 h-[calc(100vh-5rem)] overflow-auto border-r border-gray-300 ml-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 mt-20 mb-10">검색 필터</h2>

        {/* 기간 필터 */}
        <Disclosure as="div" className="mb-6">
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full p-2 text-left text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                기간
              </Disclosure.Button>
              <Disclosure.Panel className="p-2 text-sm text-gray-500 space-y-2">
                {periods.map(period => (
                  <label key={period} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox.Root
                      className="w-4 h-4 border rounded border-gray-400 flex items-center justify-center"
                      checked={selectedPeriods.includes(period)}
                      onCheckedChange={() => togglePeriod(period)}
                    >
                      <Checkbox.Indicator>
                        <CheckIcon />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span>{period}</span>
                  </label>
                ))}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* 언론사 필터 */}
        <Disclosure as="div">
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full p-2 text-left text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                언론사
              </Disclosure.Button>
              <Disclosure.Panel className="p-2 text-sm text-gray-500 space-y-2">
                {mediaCompanies.map(media => (
                  <label key={media} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox.Root
                      className="w-4 h-4 border rounded border-gray-400 flex items-center justify-center"
                      checked={selectedMedia.includes(media)}
                      onCheckedChange={() => toggleMedia(media)}
                    >
                      <Checkbox.Indicator>
                        <CheckIcon />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span>{media}</span>
                  </label>
                ))}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </aside>

      {/* 오른쪽 결과 영역 */}
      <main className="w-3/4 pl-6 ml-20">
        <h1 className="text-2xl font-bold mb-6 text-black/70 mt-20">
          '{query}' 검색 결과
        </h1>

        {/* 검색 입력 폼 */}
        <form className="mb-8 relative" onSubmit={handleSearch}>
          <label htmlFor="search-input" className="sr-only">Search</label>
          <div className="flex items-center max-w-xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 20 20">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              name="search"
              id="search-input"
              defaultValue={query}
              className="flex-1 block w-full pl-10 p-4 text-sm text-gray-900 rounded-l-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="뉴스 검색"
              required
            />
            <button
              type="submit"
              className="px-5 py-4 bg-gray-700 text-white rounded-r-lg hover:bg-gray-800 font-medium text-sm flex items-center justify-center"
            >
              검색
            </button>
          </div>
        </form>

        {/* 결과 영역 */}
        {loading ? (
          <p className="text-lg mb-6">로딩 중...</p>
        ) : filteredArticles.length === 0 ? (
          <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
  {filteredArticles.map((article, index) => (
    <div
      key={index}
      className="mb-20 group bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300 hover:shadow-2xl transition cursor-pointer flex flex-col h-[450px]"
    >
      {/* 🔹 이 부분이 이미지 영역이에요 */}
      <div className="h-55 bg-gray-100 flex items-center justify-center">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">No Image</span>
        )}
      </div>

      {/* 🔹 기사 제목, 내용 */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">{article.content}</p>
        </div>

        {/* 🔹 '자세히 보기' 버튼 */}
        <button
          className="mt-4 bg-gray-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-700 transition self-end"
          onClick={() => {
            if (article.url) window.open(article.url, '_blank');
          }}
        >
          자세히 보기
        </button>
      </div>
    </div>
  ))}
</div>


        )}
      </main>
    </div>
  );
}
