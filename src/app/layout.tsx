import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "뉴스 애그리게이터",
  description: "카테고리별 뉴스 모아보기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          {/* 상단 네비게이션 바 */}
          <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
              {/* 로고 */}
              <Link
                href="/"
                className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                뉴스피드
              </Link>

              {/* 우측 인증 영역 */}
              <div className="flex items-center gap-2">
                <Show when="signed-out">
                  <Button asChild variant="ghost" size="sm">
                    <SignInButton mode="modal">로그인</SignInButton>
                  </Button>
                  <Button asChild size="sm">
                    <SignUpButton mode="modal">회원가입</SignUpButton>
                  </Button>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>

          <Separator />

          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
