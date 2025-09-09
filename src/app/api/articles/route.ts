import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keywordRaw = searchParams.get('keyword') || '';
  const date = searchParams.get('date') || '';
  const keyword = decodeURIComponent(keywordRaw);

  const lawName = '개인정보보호법';

  try {
    const filePath = path.join(process.cwd(), 'public', 'data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lawData = JSON.parse(fileContent);

    const articles: { title: string; content: string }[] =
      lawData[lawName]?.news?.[date]?.articles || [];

    const filtered = articles.filter(
      (article) =>
        article.title.includes(keyword) ||
        article.content.includes(keyword)
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('파일 읽기 실패:', error);
    return NextResponse.json(
      { error: '데이터를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
