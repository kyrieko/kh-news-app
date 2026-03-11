'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { runCrawl } from '@/app/actions/crawl';

// 뉴스 수집 버튼 — Server Action 호출 후 페이지 새로고침
export function CrawlButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleCrawl() {
    setLoading(true);
    setResult(null);

    try {
      const data = await runCrawl();

      if (!data.success) {
        setResult(`오류: ${data.error ?? '알 수 없는 오류'}`);
        return;
      }

      const { saved, skipped, errors } = data.result!;
      setResult(`저장 ${saved}개 · 중복 ${skipped}개 · 오류 ${errors}개`);

      // 새 기사가 저장됐으면 페이지 새로고침
      if (saved > 0) {
        router.refresh();
      }
    } catch {
      setResult('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCrawl}
        disabled={loading}
      >
        {loading ? '수집 중...' : '뉴스 수집'}
      </Button>
      {result && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{result}</span>
      )}
    </div>
  );
}
