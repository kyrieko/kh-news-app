import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, articleCategories, sources, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/articles/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      summary: articles.summary,
      sourceUrl: articles.sourceUrl,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      sourceName: sources.name,
      sourceWebsiteUrl: sources.websiteUrl,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.id, id))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: '기사를 찾을 수 없습니다' }, { status: 404 });
  }

  // 연결된 카테고리 조회
  const articleCategoryRows = await db
    .select({ id: categories.id, slug: categories.slug, label: categories.label })
    .from(articleCategories)
    .innerJoin(categories, eq(articleCategories.categoryId, categories.id))
    .where(eq(articleCategories.articleId, id));

  return NextResponse.json({ ...article, categories: articleCategoryRows });
}

// PATCH /api/articles/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, summary } = body;

  const [updated] = await db
    .update(articles)
    .set({
      ...(title && { title }),
      ...(summary && { summary }),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: '기사를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/articles/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [deleted] = await db
    .delete(articles)
    .where(eq(articles.id, id))
    .returning({ id: articles.id });

  if (!deleted) {
    return NextResponse.json({ error: '기사를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
