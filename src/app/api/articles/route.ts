import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, articleCategories, sources } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

// GET /api/articles?categorySlug=ai&page=1&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('categorySlug');
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);
  const offset = (page - 1) * limit;

  // 카테고리 필터가 있는 경우 조인 테이블을 통해 articleId 목록 조회
  if (categorySlug) {
    const { categories } = await import('@/db/schema');
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: '존재하지 않는 카테고리입니다' }, { status: 404 });
    }

    const joinRows = await db
      .select({ articleId: articleCategories.articleId })
      .from(articleCategories)
      .where(eq(articleCategories.categoryId, category.id));

    const articleIds = joinRows.map((r) => r.articleId);

    if (articleIds.length === 0) {
      return NextResponse.json({ data: [], page, limit });
    }

    const data = await db
      .select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
        sourceUrl: articles.sourceUrl,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        sourceName: sources.name,
        sourceWebsiteUrl: sources.websiteUrl,
      })
      .from(articles)
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(inArray(articles.id, articleIds))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data, page, limit });
  }

  // 카테고리 필터 없이 전체 조회
  const data = await db
    .select({
      id: articles.id,
      title: articles.title,
      summary: articles.summary,
      sourceUrl: articles.sourceUrl,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      sourceName: sources.name,
      sourceWebsiteUrl: sources.websiteUrl,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data, page, limit });
}

// POST /api/articles
// body: { title, summary, sourceUrl, publishedAt, sourceName, categoryIds[] }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, summary, sourceUrl, publishedAt, sourceName, categoryIds } = body;

  if (!title || !summary || !sourceUrl || !publishedAt || !sourceName) {
    return NextResponse.json(
      { error: 'title, summary, sourceUrl, publishedAt, sourceName은 필수입니다' },
      { status: 400 }
    );
  }

  // 트랜잭션: source upsert → article insert → articleCategories insert
  const result = await db.transaction(async (tx) => {
    // 1. source upsert
    const [source] = await tx
      .insert(sources)
      .values({ name: sourceName })
      .onConflictDoUpdate({
        target: sources.name,
        set: { name: sourceName },
      })
      .returning({ id: sources.id });

    // 2. article insert
    const [article] = await tx
      .insert(articles)
      .values({
        title,
        summary,
        sourceUrl,
        publishedAt: new Date(publishedAt),
        sourceId: source.id,
      })
      .returning();

    // 3. articleCategories insert
    if (categoryIds && categoryIds.length > 0) {
      await tx.insert(articleCategories).values(
        categoryIds.map((categoryId: string) => ({
          articleId: article.id,
          categoryId,
        }))
      );
    }

    return article;
  });

  return NextResponse.json(result, { status: 201 });
}
