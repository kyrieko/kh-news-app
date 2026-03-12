import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, sources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// GET /api/articles/:id/content — 원문 크롤링 후 본문만 추출
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      sourceUrl: articles.sourceUrl,
      sourceName: sources.name,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.id, id))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: '기사를 찾을 수 없습니다' }, { status: 404 });
  }

  try {
    const res = await fetch(article.sourceUrl, {
      headers: {
        // 일부 사이트의 봇 차단 우회
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      // 서버리스 환경 타임아웃 대비
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: '원문 페이지를 불러올 수 없습니다' }, { status: 502 });
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url: article.sourceUrl });
    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();

    if (!parsed) {
      return NextResponse.json({ error: '본문을 추출할 수 없습니다' }, { status: 422 });
    }

    return NextResponse.json({
      title: parsed.title || article.title,
      content: parsed.content, // 정제된 HTML
      textContent: parsed.textContent, // 순수 텍스트
      excerpt: parsed.excerpt,
      byline: parsed.byline,
      siteName: parsed.siteName || article.sourceName,
    });
  } catch {
    return NextResponse.json({ error: '원문을 가져오는 중 오류가 발생했습니다' }, { status: 500 });
  }
}
