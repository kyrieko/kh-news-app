'use server';

import { db } from '@/db';
import { articles, articleCategories, sources, categories } from '@/db/schema';
import { fetchAllFeeds } from '@/lib/rss';
import { summarizeArticle } from '@/lib/summarize';

type CrawlResult = {
  success: true;
  result: { total: number; saved: number; skipped: number; errors: number };
} | {
  success: false;
  error: string;
};

// 뉴스 수집 Server Action
export async function runCrawl(): Promise<CrawlResult> {
  // DB에서 카테고리 전체 조회 → slug → id 매핑 테이블 생성
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map<string, string>(
    categoryRows.map((c) => [c.slug, c.id])
  );

  // 전체 RSS 피드 수집
  const feedItems = await fetchAllFeeds();

  let savedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 순차 처리 (Claude API rate limit 고려)
  for (const { item, categorySlug } of feedItems) {
    try {
      // pubDate 파싱 (실패 시 현재 시각으로 fallback)
      const parsedDate = new Date(item.pubDate);
      const publishedAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      // Claude API로 요약 생성
      const summary = await summarizeArticle(item.title, item.description);

      // 카테고리 ID 조회
      const categoryId = categoryMap.get(categorySlug);

      // source upsert (neon-http는 트랜잭션 미지원 → 순차 쿼리)
      const [source] = await db
        .insert(sources)
        .values({ name: item.sourceName })
        .onConflictDoUpdate({
          target: sources.name,
          set: { name: item.sourceName },
        })
        .returning({ id: sources.id });

      // article insert (중복 URL은 스킵)
      const inserted = await db
        .insert(articles)
        .values({
          title: item.title,
          summary,
          sourceUrl: item.link,
          publishedAt,
          sourceId: source.id,
        })
        .onConflictDoNothing()
        .returning({ id: articles.id });

      // 중복 URL — 스킵
      if (inserted.length === 0) {
        skippedCount++;
        continue;
      }

      // articleCategories insert (카테고리가 있을 때만)
      if (categoryId) {
        await db.insert(articleCategories).values({
          articleId: inserted[0].id,
          categoryId,
        });
      }

      savedCount++;
    } catch (error) {
      console.error('기사 저장 실패:', item.link, error);
      errorCount++;
    }
  }

  return {
    success: true,
    result: {
      total: feedItems.length,
      saved: savedCount,
      skipped: skippedCount,
      errors: errorCount,
    },
  };
}
