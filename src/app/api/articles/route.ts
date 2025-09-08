import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keywordRaw = searchParams.get('keyword') || '';
  const date = searchParams.get('date') || '';
  const keyword = decodeURIComponent(keywordRaw);

  const lawName = "개인정보보호법"; // 하드코딩 되어 있지만, 필요 시 확장 가능

  try {
    // ✅ JSON 파일 경로를 정확히 지정 (루트 기준)
    const filePath = path.join(process.cwd(), 'public', 'law_data.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lawData = JSON.parse(fileContent);

    const articles = lawData[lawName]?.news?.[date]?.articles || [];

    const filtered = articles.filter(
      (article: any) =>
        article.title.includes(keyword) || article.content.includes(keyword)
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("파일 읽기 실패:", error);
    return NextResponse.json(
      { error: "데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
