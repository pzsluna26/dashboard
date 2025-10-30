"use client";

interface ArticleCardProps {
  articleTitle?: string;
  articleUrl?: string;
  summary?: string;
}

export default function ArticleCard({ articleTitle, articleUrl, summary }: ArticleCardProps) {
  const hasData = articleTitle || articleUrl || summary;

  return (
    <div className="w-full h-[250px]">
      <div className="bg-white shadow-md border border-gray-200 p-6 h-full flex flex-col justify-between transition hover:shadow-xl">
        <h4 className="flex items-center gap-2 text-neutral-700 font-bold text-lg mb-3 tracking-wide">
          <img
            src="/icons/article.png"
            alt="관련기사 아이콘"
            className="w-6 h-6 object-contain"
          />
          관련기사
        </h4>

        {hasData ? (
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-3 line-clamp-2 leading-snug">
              {articleTitle}
            </h3>
            {summary && (
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {summary}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            해당 키워드에 대한 관련기사가 없습니다.
          </div>
        )}

        {articleUrl && (
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm font-bold mt-4 inline-block hover:underline"
            style={{ color: "#55AD9B" }}
          >
            원문 보기
          </a>
        )}
      </div>
    </div>
  );
}
