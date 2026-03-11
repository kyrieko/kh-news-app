# UI 코딩 표준

## 핵심 원칙

**shadcn UI 컴포넌트만 사용한다. 커스텀 컴포넌트를 절대 만들지 않는다.**

---

## shadcn UI 설치

shadcn UI는 `package.json`에 아직 추가되지 않았다. 사용 전 반드시 초기화해야 한다.

```bash
npx shadcn@latest init
```

개별 컴포넌트 추가:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# 등...
```

설치된 컴포넌트는 `src/components/ui/` 디렉토리에 위치한다.

---

## 컴포넌트 사용 규칙

### 올바른 사용 (shadcn UI 컴포넌트)

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function ArticleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>기사 제목</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge>기술</Badge>
        <Button variant="outline" size="sm">북마크</Button>
      </CardContent>
    </Card>
  )
}
```

### 금지 사항 (커스텀 컴포넌트)

```tsx
// 금지 — 직접 만든 컴포넌트
function CustomButton({ children }) {
  return <button className="...">{children}</button>
}

// 금지 — shadcn 없이 div로 카드 구성
function ArticleCard() {
  return <div className="rounded border p-4">...</div>
}
```

---

## 주요 컴포넌트 목록

이 프로젝트에서 사용할 shadcn UI 컴포넌트:

| 컴포넌트 | 용도 | 추가 명령 |
|---------|------|-----------|
| `Button` | 버튼 전반 | `npx shadcn@latest add button` |
| `Card` | 기사 카드, 패널 | `npx shadcn@latest add card` |
| `Input` | 검색, 폼 입력 | `npx shadcn@latest add input` |
| `Badge` | 카테고리 태그 | `npx shadcn@latest add badge` |
| `Select` | 카테고리 필터 | `npx shadcn@latest add select` |
| `Skeleton` | 로딩 상태 | `npx shadcn@latest add skeleton` |
| `Dialog` | 모달 | `npx shadcn@latest add dialog` |
| `DropdownMenu` | 드롭다운 메뉴 | `npx shadcn@latest add dropdown-menu` |
| `Separator` | 구분선 | `npx shadcn@latest add separator` |
| `Avatar` | 사용자 아바타 | `npx shadcn@latest add avatar` |
| `Tabs` | 탭 UI | `npx shadcn@latest add tabs` |
| `Pagination` | 페이지네이션 | `npx shadcn@latest add pagination` |

---

## 스타일링 규칙

- 스타일은 Tailwind CSS 유틸리티 클래스로만 적용한다.
- shadcn 컴포넌트의 `className` prop으로 추가 스타일을 덮어쓸 수 있다.
- 인라인 스타일(`style={{}}`)은 사용하지 않는다.
- 별도 CSS 파일을 만들지 않는다 (전역 `globals.css` 제외).

```tsx
// 올바른 방법 — className으로 커스터마이징
<Button className="w-full mt-4" variant="secondary">
  더 보기
</Button>

// 금지 — 인라인 스타일
<Button style={{ width: "100%", marginTop: "16px" }}>
  더 보기
</Button>
```

---

## shadcn UI variant 활용

컴포넌트의 `variant`와 `size` prop을 적극 활용한다.

```tsx
// Button variants
<Button variant="default">기본</Button>
<Button variant="secondary">보조</Button>
<Button variant="outline">아웃라인</Button>
<Button variant="ghost">고스트</Button>
<Button variant="destructive">삭제</Button>

// Button sizes
<Button size="sm">소</Button>
<Button size="default">중</Button>
<Button size="lg">대</Button>
<Button size="icon"><IconComponent /></Button>
```

---

## 참고

- shadcn UI 공식 문서: https://ui.shadcn.com/docs
- 컴포넌트 전체 목록: https://ui.shadcn.com/docs/components
