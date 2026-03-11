import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { userBookmarks, articles, sources } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/bookmarks - 내 북마크 목록
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const bookmarks = await db
    .select({
      id: userBookmarks.id,
      createdAt: userBookmarks.createdAt,
      articleId: articles.id,
      title: articles.title,
      summary: articles.summary,
      sourceUrl: articles.sourceUrl,
      publishedAt: articles.publishedAt,
      sourceName: sources.name,
    })
    .from(userBookmarks)
    .innerJoin(articles, eq(userBookmarks.articleId, articles.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(userBookmarks.clerkUserId, userId))
    .orderBy(desc(userBookmarks.createdAt));

  return NextResponse.json(bookmarks);
}

// POST /api/bookmarks - 북마크 추가
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { articleId } = await request.json();
  if (!articleId) {
    return NextResponse.json({ error: 'articleId는 필수입니다' }, { status: 400 });
  }

  const [bookmark] = await db
    .insert(userBookmarks)
    .values({ clerkUserId: userId, articleId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(bookmark, { status: 201 });
}

// DELETE /api/bookmarks?articleId=xxx - 북마크 삭제
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const articleId = new URL(request.url).searchParams.get('articleId');
  if (!articleId) {
    return NextResponse.json({ error: 'articleId는 필수입니다' }, { status: 400 });
  }

  await db
    .delete(userBookmarks)
    .where(
      and(
        eq(userBookmarks.clerkUserId, userId),
        eq(userBookmarks.articleId, articleId)
      )
    );

  return NextResponse.json({ success: true });
}
