'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleContentProps {
  articleId: string;
}

interface ContentData {
  title: string;
  content: string;
  byline?: string;
  siteName?: string;
}

export function ArticleContent({ articleId }: ArticleContentProps) {
  const [data, setData] = useState<ContentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles/${articleId}/content`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => setError('원문을 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* 기자 / 출처 */}
      {data.byline && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{data.byline}</p>
      )}

      {/* 본문 — Readability가 추출한 HTML을 그대로 렌더링 */}
      <div
        className="prose prose-zinc max-w-none dark:prose-invert
          prose-headings:font-bold
          prose-p:leading-relaxed
          prose-a:text-zinc-900 prose-a:no-underline
          prose-img:rounded-lg
          [&_figure]:hidden [&_aside]:hidden [&_.ad]:hidden"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </div>
  );
}
