import { db } from '@/db';
import { articles, articleCategories, categories, sources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArticleContent } from '@/components/article-content';
import { ArrowLeft, ExternalLink } from 'lucide-react';

// 기사 메타 + 카테고리 조회
async function getArticle(id: string) {
  const [article] = await db
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
    .where(eq(articles.id, id))
    .limit(1);

  if (!article) return null;

  const articleCategoryRows = await db
    .select({ id: categories.id, slug: categories.slug, label: categories.label })
    .from(articleCategories)
    .innerJoin(categories, eq(articleCategories.categoryId, categories.id))
    .where(eq(articleCategories.articleId, id));

  return { ...article, categories: articleCategoryRows };
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

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* 상단 네비게이션 바 */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              대시보드로
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
              원문 보기
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </header>

      {/* 기사 본문 */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* 메타 정보 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{article.sourceName}</Badge>
          {article.categories.map((cat) => (
            <Badge key={cat.id} variant="outline">
              {cat.label}
            </Badge>
          ))}
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            {formatDate(article.publishedAt)}
          </span>
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-2xl font-bold leading-snug text-zinc-900 dark:text-zinc-50">
          {article.title}
        </h1>

        {/* 요약 */}
        <p className="mb-6 rounded-lg bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {article.summary}
        </p>

        <Separator className="mb-6" />

        {/* 원문 본문 (클라이언트 컴포넌트에서 fetch) */}
        <ArticleContent articleId={id} />
      </main>
    </div>
  );
}
