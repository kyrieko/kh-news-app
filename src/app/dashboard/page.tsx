import { db } from '@/db';
import { articles, articleCategories, categories, sources } from '@/db/schema';
import { eq, desc, inArray, asc, count } from 'drizzle-orm';
import Link from 'next/link';

const PAGE_SIZE = 5;

// 기사 목록 + 전체 개수 조회 (카테고리 필터, 페이지네이션 포함)
async function getArticles(categorySlug?: string, page = 1) {
  const offset = (page - 1) * PAGE_SIZE;

  if (categorySlug) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!category) return { data: [], total: 0 };

    const joinRows = await db
      .select({ articleId: articleCategories.articleId })
      .from(articleCategories)
      .where(eq(articleCategories.categoryId, category.id));

    const articleIds = joinRows.map((r) => r.articleId);
    if (articleIds.length === 0) return { data: [], total: 0 };

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: articles.id,
          title: articles.title,
          summary: articles.summary,
          sourceUrl: articles.sourceUrl,
          publishedAt: articles.publishedAt,
          sourceName: sources.name,
        })
        .from(articles)
        .innerJoin(sources, eq(articles.sourceId, sources.id))
        .where(inArray(articles.id, articleIds))
        .orderBy(desc(articles.publishedAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select({ total: count() })
        .from(articles)
        .where(inArray(articles.id, articleIds)),
    ]);

    return { data, total: Number(total) };
  }

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
        sourceUrl: articles.sourceUrl,
        publishedAt: articles.publishedAt,
        sourceName: sources.name,
      })
      .from(articles)
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .orderBy(desc(articles.publishedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(articles),
  ]);

  return { data, total: Number(total) };
}

// 카테고리 목록 조회
async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.label));
}

// 날짜 포맷
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// 페이지네이션 URL 생성
function buildUrl(page: number, categorySlug?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set('category', categorySlug);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/dashboard${qs ? `?${qs}` : ''}`;
}

interface DashboardPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { category: categorySlug, page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam ?? '1'));

  const [{ data: articleList, total }, categoryList] = await Promise.all([
    getArticles(categorySlug, currentPage),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const selectedCategory = categoryList.find((c) => c.slug === categorySlug);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* 왼쪽 사이드바 - 카테고리 */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="sticky top-0 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            주제
          </h2>
          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !categorySlug
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              전체
            </Link>
            {categoryList.map((cat) => (
              <Link
                key={cat.id}
                href={`/dashboard?category=${cat.slug}`}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  categorySlug === cat.slug
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* 오른쪽 메인 콘텐츠 */}
      <main className="flex-1 px-8 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {selectedCategory ? selectedCategory.label : '전체 뉴스'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            총 {total}개의 기사
          </p>
        </div>

        {/* 기사 목록 */}
        {articleList.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-zinc-400 dark:text-zinc-600">
            기사가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {articleList.map((article) => (
              <article
                key={article.id}
                className="rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {article.sourceName}
                  </span>
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">·</span>
                  <time className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDate(article.publishedAt)}
                  </time>
                </div>
                <h2 className="mb-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {article.title}
                  </a>
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {article.summary}
                </p>
              </article>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1">
            {/* 이전 버튼 */}
            {currentPage > 1 ? (
              <Link
                href={buildUrl(currentPage - 1, categorySlug)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ← 이전
              </Link>
            ) : (
              <span className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 dark:text-zinc-600">
                ← 이전
              </span>
            )}

            {/* 페이지 번호 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-zinc-400">
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={buildUrl(item, categorySlug)}
                    className={`min-w-[36px] rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                      item === currentPage
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {item}
                  </Link>
                )
              )}

            {/* 다음 버튼 */}
            {currentPage < totalPages ? (
              <Link
                href={buildUrl(currentPage + 1, categorySlug)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                다음 →
              </Link>
            ) : (
              <span className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 dark:text-zinc-600">
                다음 →
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
