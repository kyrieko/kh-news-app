# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 실행 (Next.js)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 실행

# Drizzle 마이그레이션
npx drizzle-kit generate   # 스키마 변경사항으로 마이그레이션 파일 생성
npx drizzle-kit migrate    # 마이그레이션 적용
npx drizzle-kit studio     # Drizzle Studio (DB GUI) 실행
```

## 환경 변수

`.env.local` 파일에 아래 변수가 필요합니다:

```
DATABASE_URL=          # Neon PostgreSQL 연결 문자열 (neon.tech 콘솔에서 확인)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## 아키텍처 개요

Next.js 16 App Router 기반 뉴스 애그리게이터. 인증은 Clerk, DB는 Neon(PostgreSQL 서버리스), ORM은 Drizzle.

### 데이터 흐름

```
클라이언트 → Clerk 미들웨어(src/middleware.ts) → Next.js API Route → Drizzle ORM → Neon(PostgreSQL)
```

모든 요청은 `src/middleware.ts`의 `clerkMiddleware()`를 통과한다. `/api/bookmarks`는 인증 필수(`auth()`로 `userId` 확인), 나머지 API는 공개 접근 가능.

### DB 스키마 (`src/db/schema.ts`)

5개 테이블의 관계:

```
sources ──< articles >──< article_categories >── categories
                  └──< user_bookmarks (clerk_user_id 참조)
```

- `sources`: 뉴스 출처 (name unique)
- `categories`: 카테고리 (slug unique) — 현재 데이터: 정치/경제/기술/사회/국제
- `articles`: 기사 (source_url unique, source_id FK)
- `article_categories`: 기사-카테고리 다대다 조인 테이블
- `user_bookmarks`: Clerk userId + articleId로 북마크 관리

DB 클라이언트(`src/db/index.ts`)는 `@neondatabase/serverless`의 Neon HTTP 드라이버를 사용한다. WebSocket이 아닌 HTTP 기반이라 서버리스/엣지 환경에 적합하다.

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/articles` | 기사 목록 (`?categorySlug=`, `?page=`, `?limit=`) |
| POST | `/api/articles` | 기사 생성 (source upsert → article → categories 트랜잭션) |
| GET | `/api/articles/:id` | 기사 상세 + 연결된 카테고리 |
| PATCH | `/api/articles/:id` | 기사 제목/요약 수정 |
| DELETE | `/api/articles/:id` | 기사 삭제 |
| GET | `/api/categories` | 카테고리 목록 |
| GET/POST | `/api/sources` | 출처 목록 조회 / 추가 |
| GET | `/api/bookmarks` | 내 북마크 목록 (인증 필요) |
| POST | `/api/bookmarks` | 북마크 추가 (인증 필요) |
| DELETE | `/api/bookmarks?articleId=` | 북마크 삭제 (인증 필요) |

### Neon 데이터베이스

- 드라이버: `drizzle-orm/neon-http` + `@neondatabase/serverless`
- 연결: `DATABASE_URL` 환경변수 (Neon 콘솔 → 프로젝트 → Connection string)
- MCP: `mcp__neon__*` 툴로 DB 조작 가능 (쿼리 실행, 브랜치 관리 등)

### 스키마 변경 시 주의

Drizzle 스키마(`src/db/schema.ts`)를 수정한 후 반드시 마이그레이션 파일을 생성하고 적용해야 한다. Neon MCP가 연결된 경우 `mcp__neon__run_sql`로 직접 SQL 실행 가능.

## 코드 작성 전 필수 참조

코드를 작성하기 전에 반드시 `docs/` 디렉토리의 관련 파일을 먼저 읽고, 기존 패턴과 규칙, 모범 사례를 파악한 뒤 그에 맞게 구현한다.

| 파일 | 내용 |
|------|------|
| `docs/ui.md` | UI 컴포넌트 규칙 (shadcn UI 전용, 커스텀 컴포넌트 금지) |
