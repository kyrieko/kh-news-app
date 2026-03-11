import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-20">
      <div className="flex max-w-xl flex-col items-center gap-8 text-center">
        {/* 헤드라인 */}
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="self-center">뉴스 애그리게이터</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            세상의 모든 뉴스를<br />한 곳에서
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            정치, 경제, 기술, 사회, 국제 — 카테고리별로 정리된 뉴스를 빠르게 확인하세요.
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">뉴스 보러 가기</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard?category=technology">기술 뉴스</Link>
          </Button>
        </div>

        {/* 카테고리 소개 카드 */}
        <Card className="w-full text-left">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-500">제공 카테고리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["정치", "경제", "기술", "사회", "국제"].map((label) => (
                <Badge key={label} variant="outline">{label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
