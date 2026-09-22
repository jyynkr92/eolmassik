# AI Instructions

> 얼마씩(eolmassik) — 가입 없이 링크 하나로 끝내는 1/N 정산
> 기획·설계의 단일 출처는 `얼마씩_기획설계.md` 다. 판단이 갈리면 그 문서를 따른다.

## Tech Stack

- Vite 8, React 19, TypeScript 7 (strict)
- TanStack Router (SPA, 파일 기반 라우팅 + autoCodeSplitting)
- Zustand — 클라이언트 상태
- Tailwind CSS v4 (`tailwindcss ^4.3`)
- Zod — 외부에서 들어온 데이터(공유 URL) 검증
- lz-string — 정산 상태 URL 인코딩
- Vitest + fast-check — 계산 로직 단위·property 테스트
- Biome — 린트 + 포맷 (ESLint/Prettier 를 쓰지 않는다)
- Vercel 배포
- i18n 없음 — 한국어 전용 (국내 사용자 대상 서비스)

**서버 상태 없음**: 이 레포에는 백엔드가 없다. TanStack Query, API 클라이언트, MSW 가 존재하지 않는다.
정산 데이터는 전부 URL fragment 와 localStorage 에만 산다. 이식 코드에서 발견하면 제거한다.
(단축 URL 폴백 백엔드가 생기면 그 시점에 이 항목을 재검토한다. 기획설계 6.2)

**SSR 없음**: `'use client'`, `next/*`, `next-intl`, `next-themes` 는 이 레포에 존재하지 않는다. 이식 코드에서 발견하면 제거한다.

**Tailwind 설정**: `tailwind.config.*` 파일을 생성하지 않는다. v4 는 CSS-first 설정을 사용한다.
토큰은 `src/styles/theme.css`(값) → `src/styles/globals.css`(`@theme inline` 매핑) 순서로 정의한다.

---

## 이 프로젝트의 불변 규칙

다른 모든 규칙에 우선한다. 돈 계산이 1원이라도 틀리면 서비스 신뢰가 무너진다.

1. **금액은 정수 원 단위만 쓴다.** 부동소수 금액을 만들지 않는다.
   나눗셈은 `Math.floor` 로 내리고 남은 잔차를 흡수자에게 몰아준다. 기획설계 4.1
2. **`src/lib/calc/` 는 UI 에 의존하지 않는 순수 함수만 둔다.**
   React import, 스토어 접근, DOM 접근 금지.
3. **계산 로직을 수정하면 테스트를 함께 수정한다.** 최소 아래 불변식은 항상 성립해야 한다.
   - 항목별 부담액의 합 == 항목 금액
   - 전체 부담액의 합 == 전체 결제액의 합
   - 엣지 케이스: 추가 부담이 항목 금액 초과 / `full` 부담자 복수 / 참여자 1명 / 금액 0원
   합계 불변식은 예제 테스트가 아니라 fast-check property 로 고정한다.
4. **디코드한 데이터를 신뢰하지 않는다.** 공유 URL 은 남이 편집할 수 있다.
   `src/lib/codec/` 의 디코드 결과는 반드시 Zod 로 검증하고, 실패를 타입으로 드러낸다.
5. **축약 스키마에는 버전 번호를 유지한다.** 스키마를 바꾸면 버전을 올리고
   구버전 링크의 마이그레이션 경로를 함께 넣는다. 기획설계 6.2
6. **정산 데이터를 query string 에 넣지 않는다.** fragment(`#`) 여야 서버 로그에 남지 않는다.

---

## 작업 분류 체계

작업을 받으면, 실행 전에 반드시 분류를 먼저 선언한다.

> 이 작업을 [Fast / Standard / Critical]으로 분류했습니다. 이유: [한 줄 설명]

### Fast

다음 조건을 모두 만족하는 경우: 1~2개 파일 변경, 로직 변경 없음, Breaking Change 없음.
텍스트/주석/스타일 변경은 테스트 조건에서 제외한다.

즉시 실행한다. 완료 후 결과만 보고한다.

### Standard

기능 개발, 버그 수정, 리팩터링, 의존성 업데이트 등 일반적인 작업.

분류 후 사용자 확인을 받고 진행한다.

### Critical

영향 범위가 큰 작업. 이 레포에서는 특히 다음이 해당한다.

- `src/lib/calc/` 의 계산 규칙 변경 (사용자에게 잘못된 금액이 나갈 수 있음)
- `src/lib/codec/` 의 축약 스키마 변경 (이미 공유된 링크가 깨질 수 있음)
- 환경 변수, 배포 파이프라인, 외부 SDK(카카오) 연동

분류 후 사용자 확인을 받고, 변경 계획을 제시한 뒤 한 번 더 승인을 받는다. (2단계 승인)

---

## 브랜치 전략

```
feature branch  →  develop  →  main
```

- **기능 브랜치의 PR 은 항상 `develop` 으로 보낸다.** `main` 을 직접 target 하지 않는다.
- `main` 으로 가는 PR 은 `develop` 에서만 온다. 릴리스 시점에 올린다.
- `main` 과 `develop` 은 직접 push 와 삭제가 금지되어 있다. 변경은 PR 로만 들어간다.
- 머지 조건은 **CI 전체 통과**다. 승인 리뷰어 수는 0명이지만 검사는 우회할 수 없다.
- `main` 에 머지되면 Vercel 이 프로덕션으로 배포한다. 머지 = 배포임을 항상 염두에 둔다.

### 브랜치 네이밍

`type/description` 형식을 쓴다.

```
feat/extra-charge    fix/rounding-residual    chore/typescript-7
```

type prefix: `feat/`, `fix/`, `refactor/`, `hotfix/`, `perf/`, `chore/`, `docs/`

---

## 작업 유형별 워크플로우

분류 후 작업 유형에 따라 아래 워크플로우를 따른다.

### New Feature

1. **파악** — 요구사항이 모호하면 질문으로 명확화한다
2. **설계** — 영향받는 파일/컴포넌트 구조를 정리하여 plan 을 작성한다
3. **planning 리뷰** — 작성한 plan 을 사용자에게 제시하고 승인을 받은 뒤 구현에 착수한다
4. **구현** — 계산 로직이 포함되면 `lib/calc` → 스토어 → 훅 → 컴포넌트 순서로 작업한다.
   UI 전용이면 컴포넌트 → 훅 → 스토어 순서로 작업한다
5. **검증** — `pnpm check-types`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` 확인 + 기존 기능 회귀 체크
6. **리뷰** — 변경 사항 요약 보고

### Bug Fix

1. **원인 파악** — 재현 경로와 근본 원인 특정
2. **계획** — 수정 방향 + 회귀 방지 방안 제시 → 사용자 확인
3. **수정** — 최소 범위로 수정, 관련 없는 코드 변경 금지
4. **검증** — 빌드 확인, 원래 버그가 해결되었는지 확인.
   금액 계산 버그라면 **재현 케이스를 테스트로 먼저 고정한 뒤** 수정한다
5. **보고** — 근본 원인 / 수정 내용 / 재발 방지 방안 명시

### Refactor

1. **현행 분석** — 현재 동작을 먼저 파악한다
2. **범위 확인** — 변경 범위를 사용자와 합의한다
3. **구현** — 기존 동작을 유지하며 구조만 개선한다
4. **검증** — 빌드 확인, 기능적 변화 없음을 확인
5. **보고** — "기능적 변화 없음. 내부 구조만 개선." 명시

### Hotfix — Critical

1. **긴급 파악** — 원인 특정을 병행하며 최소 수정안 도출
2. **축약 승인** — 사용자 확인 (간략화 가능)
3. **최소 수정** — 문제 해결에 필요한 최소한의 변경만 적용
4. **검증** — 핵심 경로만 빠르게 확인
5. **사후 조치** — 근본 원인 조사가 따로 필요하면 그 사실을 명시하고, 후속 작업으로 남긴다

### UI/UX 개선

1. **현상 진단** — 개선 전 현재 문제점 정리 (레이아웃, 접근성 등)
2. **방향 제시** — 개선 방안을 제시 → 사용자 확인
3. **구현** — 접근성(a11y)을 구현 단계에서 함께 반영
4. **검증** — 빌드 확인, 브라우저에서 시각적 확인.
   주 사용처가 모바일이므로 **좁은 뷰포트에서 먼저 확인**한다
5. **보고** — 변경된 화면/컴포넌트, UX 개선 포인트, a11y 변경사항 명시

### Performance

1. **측정** — 최적화 전 기준값(baseline)을 먼저 측정한다. 추측 금지
2. **계획** — 측정된 병목 기반으로 접근 방식 제시 → 사용자 확인
3. **구현** — 정확성 회귀 없이 최적화 적용
4. **검증** — 개선 전/후 수치 비교 필수
5. **보고** — 지표명 / Before / After / 개선율(%) 포함

### Dependency Update

1. **기준선** — 변경 전 빌드 상태 확인
2. **계획** — patch(일괄), minor(개별), major(별도 커밋)로 분리
3. **업데이트** — 의존성 업데이트 및 충돌 해결
4. **검증** — 빌드 확인, 기준선 대비 새로운 에러 여부 확인
5. **보고** — 업데이트 패키지 목록 (이름: old → new), Breaking Change 여부

### Docs — Fast or Standard

- 변경된 내용과 관련된 문서를 갱신한다
- 1~2개 파일이면 Fast, 구조 변경이면 Standard
- 설계 결정이 바뀌면 `얼마씩_기획설계.md` 9장(의사결정 기록)도 함께 갱신한다

---

## 안전 규칙

### 모호함 처리

- 해석이 2가지 이상이면 둘 다 제시하고, 어느 쪽인지 질문한다.
- 조용히 가정하지 않는다.

### 범위 제한

- 요청받은 것만 수정한다.
- 작업 중 인접한 이슈를 발견하면: "작업 중 [이슈] 발견. 이번 PR 에 포함할까요, 별도 처리할까요?"
- 조용히 범위를 확장하지 않는다.

### Breaking Change — 반드시 사전 확인

아래 항목은 모든 분류(Fast/Standard/Critical)에서 변경 전 반드시 확인한다:

- 계산 규칙(`lib/calc`) / 축약 스키마(`lib/codec`) / localStorage 스키마 및 버전
- 환경 변수 / 외부 서비스 연동(카카오 SDK) / 되돌릴 수 없는 마이그레이션
- 새로운 major 의존성 추가 또는 기존 의존성 교체

### 승인 없이 금지

- 프로젝트 디렉토리 밖 파일 수정
- 요청하지 않은 리팩터링이나 코드 정리
- 계산 결과가 바뀌는 변경
- 환경 변수 추가/변경/삭제
- 비임시 파일 삭제
- 의존성 설치 (계획 단계에서 합의된 것만 허용)

---

## 라이브러리 선택 기준

새 패키지를 도입하기 전에 아래 절차를 따른다.

### 평가 흐름

1. "잘 관리되는 라이브러리가 이 문제를 해결하는가?" 먼저 확인
2. npm trends, GitHub stars, 마지막 커밋 날짜, 번들 사이즈, 의존성 수, 라이선스 확인
3. 기존 스택과의 호환성, 버전 충돌, 번들 영향도 확인
4. 추천안 + 대안을 제시

### 라이브러리 사용

- 성숙한 솔루션 존재 (활발한 유지보수, 최근 커밋)
- 구현 시간 2시간 이상 절약
- 직접 구현 시 놓치기 쉬운 엣지 케이스 처리 (날짜, 좌표 변환, a11y, 암호화 등)

### 직접 구현

- 핵심 비즈니스 로직 (경쟁 우위) — **정산 계산 로직은 항상 직접 구현한다**
- 단순 유틸리티 (20줄 미만)
- 적절한 라이브러리가 없는 경우
- 최소한의 기능에 비해 번들 사이즈가 과도한 경우

### 규칙

- 새 의존성 추가는 계획 단계에서 사용자 승인을 받는다.
- 기존 의존성 교체는 Breaking Change — 별도로 확인한다.
- 이 앱은 카톡에서 링크를 타고 들어오는 모바일 웹이다. **첫 로드 번들 크기를 의사결정에 포함**한다.

---

## General Principles

- 읽기 쉬운 코드를 우선한다. 영리함보다 가독성.
- 불필요한 추상화를 피한다.
- 기존 유틸리티가 있으면 재사용한다.
- 조기 최적화하지 않는다. memoization 은 필요할 때만 사용한다.
- 불필요한 리렌더링을 방지한다.
- early return 을 사용한다.
- `any` 타입 사용 불가. strict typing 을 사용한다.
- 사용자-facing 텍스트는 한국어로 `constants/text/` 에 모아두고 컴포넌트에서 가져다 쓴다.
  i18n 은 도입하지 않지만, 문구가 화면 곳곳에 흩어지면 같은 말이 화면마다 달라진다.

### 함수 작성 규칙

모든 함수는 **함수 표현식**으로 작성한다.

```ts
// ✅
const calculateItem = (item: Item, participants: Participant[]) => { ... };
const handleButtonClick = () => { ... };

// ❌
function calculateItem(item: Item, participants: Participant[]) { ... }
function handleButtonClick() { ... }
```

동일한 조건에서 return 하는 if 문은 하나로 합친다.

```ts
// ✅
if (!item || !payer) return null;

// ❌
if (!item) return null;
if (!payer) return null;
```

### 파일 / 폴더 네이밍

모든 파일명과 폴더명은 **kebab-case** 를 사용한다.

```
features/items/item-detail-sheet.tsx
hooks/use-settlement-result.ts
store/settlement-store.ts
lib/format.ts
```

**테스트 전용 파일은 이름으로 드러낸다.**

| 대상 | 규칙 | 예시 |
|---|---|---|
| 테스트 | `*.test.ts` | `calculate-item.test.ts` |
| 테스트 전용 헬퍼 | `*.test-helper.ts` | `arbitraries.test-helper.ts` |

`fast-check` 처럼 devDependency 를 쓰는 파일이 앱 코드처럼 보이면, 누군가 import 하는 순간
프로덕션 번들로 끌려온다. `biome.json` 의 `overrides` 가 테스트가 아닌 파일에서의
`fast-check` import 를 error 로 막는다. 테스트 전용 의존성을 새로 들이면 그 목록에 함께 추가한다.

### 함수 / 변수 네이밍

| 대상 | 규칙 |
|---|---|
| 이벤트 핸들러 | `handle` + Target + Action (`handleAmountChange`, `handleShareClick`) |
| boolean 변수 | `is`, `has`, `can`, `should` 접두어 (`isReadOnly`, `hasExtraCharge`) |
| 상태 변수 | `const [value, setValue]` 형식 유지 |
| useEffect 내부 함수 | `fetch`, `load`, `init` 접두어 (`loadSharedSettlement`, `initKakaoSdk`) |

**긍정 네이밍 우선** — 부정형/이중 부정은 한 번 더 해석을 요구한다.

```ts
// ✅
const payingParticipants = participants.filter((p) => p.headcount > 0);
const visibleItems = items.filter((i) => i.isVisible);

// ❌
const nonZeroParticipants = participants.filter((p) => p.headcount > 0);
const notHiddenItems = items.filter((i) => i.isVisible);
```

boolean 변수는 예외: `is`/`has`/`can`/`should` 접두어가 이미 긍정형 prefix 이므로 `isEmpty`, `hasError` 등은 허용된다.
단 `isNotXxx` 처럼 접두어 안에 부정이 들어가는 건 피한다.

---

## 파일 / 폴더 구조

| 대상 | 규칙 | 예시 |
|---|---|---|
| 라우트 | `src/routes/*.tsx` | `routes/s.tsx` |
| 기능 단위 | `features/feature/component-name.tsx` | `features/items/item-row.tsx` |
| 공통 UI | `components/ui/` | `components/ui/button.tsx` |
| hook | `hooks/use-xxx.ts` | `hooks/use-settlement-result.ts` |
| 상태 관리 | `store/feature-store.ts` | `store/settlement-store.ts` |
| 공통 유틸 | `lib/` | `lib/format.ts` |
| 도메인 유틸 | `lib/feature/` | `lib/calc/calculate-item.ts` |
| 타입 | `types/feature/` | `types/settlement/index.ts` |
| 상수 | `constants/` | `constants/settlement.ts` |
| 텍스트 | `constants/text/` | `constants/text/home.ts` |
| 스타일 | `styles/` | `styles/globals.css` |

현재 features 구성은 기획설계 5장의 화면 흐름을 따른다.

```
src/
├─ features/
│  ├─ participants/   참여자 입력, 프리셋
│  ├─ items/          항목 입력, 추가 부담 설정
│  ├─ result/         부담액·송금 계산 결과
│  └─ share/          공유 액션 UI 컴포넌트
├─ lib/
│  ├─ calc/           정산 계산 로직 (순수 함수 + 테스트)
│  ├─ codec/          URL 인코딩·디코딩 (키 축약 스키마)
│  └─ share/          공유 텍스트·URL 생성, 외부 공유 연동
├─ routes/            화면 (/ 편집, /s 읽기 전용)
├─ store/             Settlement 전역 상태
├─ constants/
│  └─ text/           화면별 사용자-facing 문구
├─ types/
└─ styles/
```

> `utils/` 와 `lib/` 를 혼용하지 않는다. 공통 유틸 함수는 `lib/` 에 통합한다.
> 도메인 유틸은 `lib/feature/` 아래에 둔다.
> `api/`, `mock/`, `hooks/` 는 필요해지는 시점에 만든다. 빈 폴더를 미리 만들지 않는다.

- `features/` 에는 화면을 구성하는 컴포넌트와 그 UI 동작을 둔다.
- React 컴포넌트가 아닌 도메인 함수는 `lib/feature/` 에 둔다.
- 둘 이상의 모듈이 공유하는 공개 타입은 `types/feature/` 에 둔다. 파일 안에서만 쓰는 구현 타입은 해당 파일에 둔다.

---

## 라우팅 (TanStack Router)

- `src/routes/` 의 파일 구조가 곧 URL 이다. `routes/s.tsx` → `/s`
- 각 라우트 파일은 `createFileRoute('<path>')({ component })` 를 `Route` 로 export 한다.
- `src/routeTree.gen.ts` 는 플러그인이 생성하는 파일이다. 직접 수정하지 않는다. (Biome 제외 대상)
- 루트 레이아웃(Provider, 전역 레이아웃)은 `routes/__root.tsx` 에 둔다.
- 페이지 이동은 `<Link to="...">` / `useNavigate()` 를 사용한다. `window.location` 을 쓰지 않는다.
- **예외**: 정산 데이터는 fragment 에 담기므로 `window.location.hash` 읽기는 허용한다.
  라우터가 fragment 를 상태로 다루지 않기 때문이다. 읽기는 `lib/codec` 를 통해서만 한다.

---

## 컴포넌트 작성 규칙

- 컴포넌트는 화살표 함수 표현식으로 선언한다.
- Props 타입은 `interface` 로 정의한다.
- `displayName` 은 **이름 추론이 깨질 때만** 명시한다. `memo()` / `forwardRef()` 로 감싸거나
  팩토리로 동적 생성한 경우다. 평범하게 `const` 에 할당한 컴포넌트는 변수명에서 이름이
  추론되므로 붙이지 않는다.
- 300줄 이상이거나 복잡한 컴포넌트는 component + hook + types + styles 로 분리한다.
- 최상위 return 요소는 의미 있는 semantic 태그를 사용한다. (`<section>`, `<main>`, `<dialog>`)

```tsx
interface Props {
  label: string;
  onClick: () => void;
}

const SubmitButton = ({ label, onClick }: Props) => {
  return (
    <button className="bg-accent-base text-accent-on w-full" onClick={onClick}>
      {label}
    </button>
  );
};

export default SubmitButton;
```

`displayName` 이 필요한 경우는 이렇게 이름이 사라질 때다.

```tsx
// memo() 로 감싸면 DevTools 에 Anonymous 로 뜬다
const ItemRow = memo(({ item }: Props) => {
  return <li>{item.name}</li>;
});

ItemRow.displayName = 'ItemRow';
```

---

## Zustand 상태 관리

| 대상 | 규칙 |
|---|---|
| 상태 파일명 | `feature-store.ts` |
| 상태 읽기 | `const value = useXXXStore((state) => state.value)` (selector 사용) |
| 로직 분리 | 내부 로직은 actions, selectors 로 분리 |
| 파생 값 | 계산 결과를 스토어에 저장하지 않는다. `lib/calc` 순수 함수로 그때그때 파생시킨다 |
| 영속화 | `persist` 미들웨어 사용. 스키마를 바꾸면 `version` 을 올리고 `migrate` 를 함께 넣는다 |

스토어에는 **사용자가 입력한 원본(Settlement)만** 둔다. 부담액·송금 내역처럼 계산으로 나오는 값은
스토어에 두지 않는다. 두 곳에 두면 반드시 어긋난다.

---

## 계산 로직 (`src/lib/calc`)

- UI 에 의존하지 않는 **순수 함수**만 둔다. 같은 입력이면 항상 같은 출력이어야 한다.
- 함수 하나당 파일 하나. 파일명은 함수명의 kebab-case. (`calculate-item.ts`)
- 모든 공개 함수는 같은 폴더의 `*.test.ts` 를 가진다.
  단, `*.test-helper.ts` 는 테스트 전용 파일이므로 이 규칙에서 제외한다.
- **밖으로 내보내는 타입은 `types.ts` 에, 그 파일 안에서만 쓰는 타입은 그 파일에 둔다.**
  구현 세부 타입을 `types.ts` 로 올리면 계산 모듈의 공개 계약처럼 보인다.
- 합계 불변식은 fast-check property 테스트로 고정한다. 예제 테스트만으로는 부족하다.
- 기획설계 4.1 의 검증 예제(고기 32,000원 → 잔차 1원 결제자 흡수)는 회귀 테스트로 유지한다.

```ts
// 합계 불변식은 이런 형태로 고정한다
fc.assert(
  fc.property(arbitraryItem(), (item) => {
    const shares = calculateItem(item, participants);
    expect(sum(shares)).toBe(item.amount);
  }),
);
```

---

## URL 인코딩 (`src/lib/codec`)

```
Settlement → 키 축약 스키마 → lz-string 압축 → base64url → /s#<encoded>
```

- 축약 스키마는 이 레이어에만 둔다. 앱 내부 모델(`types/settlement`)은 풀 키를 유지한다.
- 스키마 맨 앞에 버전 번호를 둔다. 스키마 변경 시 버전을 올리고 마이그레이션 경로를 넣는다.
- 참여자 참조(`payerId`, `participantIds`)는 인코딩 시 배열 인덱스로 치환한다.
  항목마다 반복되므로 URL 길이에 가장 크게 영향을 준다.
- 디코드 결과는 반드시 Zod 로 검증한다. 실패 시 던지지 말고 결과 타입으로 드러낸다.
- URL 이 `URL_FALLBACK_THRESHOLD`(1,500자)를 넘으면 단축 백엔드로 폴백한다. 기획설계 6.2

---

## 스타일링

| 대상 | 규칙 |
|---|---|
| 기본 방식 | Tailwind CSS 클래스 기반 스타일 |
| 디자인 토큰 | `styles/theme.css`(값) + `styles/globals.css`(`@theme inline` 매핑). 색상은 반드시 토큰 사용 |
| 커스텀 CSS | `globals.css`, `component.module.css` 로 한정 |
| 설정 | Tailwind v4 CSS-first 설정 사용. `tailwind.config.*` 생성 금지 |
| 다크 모드 | `.dark` 클래스 기반 (`@custom-variant dark`) |
| arbitrary value | Tailwind 기본 spacing scale 클래스를 우선 사용한다. `w-[400px]` 대신 `w-100` 사용 |
| 금액 표시 | 자릿수가 흔들리지 않도록 `.tabular` 클래스를 함께 쓴다 |
| 클래스 병합 | `cn()` (`src/lib/cn.ts`) 사용. 디자인 토큰 충돌 방지 설정이 들어 있다 |

색상은 `text-on-surface-base`, `bg-surface-dim`, `border-outline-base` 같은 토큰 클래스를 쓴다.
`text-gray-500` 처럼 Tailwind 기본 팔레트를 직접 쓰지 않는다. (다크 모드에서 깨진다)

---

## 기타 규칙

### import 순서

1. `react`
2. 외부 라이브러리
3. alias (`@/`)
4. 상대경로

각 그룹 사이에 빈 줄로 구분한다.

```ts
import { useState } from 'react';

import { create } from 'zustand';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import type { Settlement } from '@/types/settlement';

import { formatWon } from './format';
```

### 타입

- Props 타입은 `interface` 를 사용한다.
- 그 외 타입 정의는 `type` 을 사용한다.
- 도메인 타입은 `types/feature/` 에 두고, 계산 결과 타입은 `lib/calc` 옆에 둔다.
- `any` 타입 사용 불가.

```ts
// Props → interface
interface Props {
  label: string;
  onClick: () => void;
}

// 그 외 → type
type Transfer = {
  fromId: string;
  toId: string;
  amount: number;
};
```

### null / undefined 체크

- 명시적 분기를 선호한다.
- `??`, `?.` 는 단순 할당이나 접근에서 사용 가능하지만, 복잡한 로직에서는 명시적 분기를 사용한다.
- `||` 대신 `??` 를 사용한다.
- **금액에는 `||` 를 쓰지 않는다.** `0` 이 falsy 라 유효한 금액이 조용히 대체된다.

```ts
// ✅ 단순 할당 — nullish coalescing 허용
const name = participant.name ?? '이름 없음';
const headcount = participant.headcount ?? 1;

// ✅ 로직 분기 — 명시적 if 문 사용
if (!item) return null;

// ❌ 0원이 기본값으로 덮인다
const amount = item.amount || 0;
```

### 상수 / 타입 정의

하드코딩을 지양하고 `constants/`, `types/` 에 정의하여 사용한다.

사용자-facing 텍스트는 `constants/text/` 아래 **화면 단위로 파일을 나눈다.**
파일명은 화면 이름의 kebab-case 이고, 상수명은 `SCREEN_TEXT` 형태의 `as const` 객체다.
두 화면 이상에서 쓰는 문구만 `common.ts` 에 둔다.

```ts
// constants/text/share.ts — [5] 공유받은 결과. 기획설계 5.6
export const SHARE_TEXT = {
  title: '공유받은 정산',
  description: '읽기 전용 결과 화면',
} as const;
```

접근성 레이블(`aria-label`)과 에러 메시지도 같은 규칙을 따른다.

### 주석

`// TODO`, `// NOTE`, `// HACK` 형식을 일관되게 사용한다.
기획설계 문서의 근거를 인용할 때는 `기획설계 4.1` 처럼 절 번호를 적는다.

### Performance

- 불필요한 리렌더링을 방지한다.
- memoization(`useMemo`, `useCallback`, `React.memo`)은 측정 가능한 성능 문제가 있을 때만 사용한다.
- 조기 최적화하지 않는다.
- 무거운 라이브러리는 라우트 분리로 코드 스플리팅한다. (router 플러그인의 `autoCodeSplitting`)

---

## 검증 명령

```bash
pnpm dev            # 개발 서버 (http://localhost:3000)
pnpm check-types    # 타입 검사
pnpm lint           # Biome 린트
pnpm test           # Vitest 실행
pnpm build          # 타입 검사 + 프로덕션 빌드
pnpm format         # Biome 포맷·자동수정 적용
pnpm format:check   # Biome 검사만 (CI 와 동일)
```

작업 완료 보고 전에 최소 `pnpm check-types` + `pnpm lint` + `pnpm format:check` + `pnpm test` 를 통과시킨다.
계산 로직을 건드렸다면 `pnpm test` 는 **필수**다.

PR 이 열리거나 갱신되면 GitHub Actions(`.github/workflows/ci.yml`)가 lint / build / audit 을 검사한다.
로컬에서 먼저 걸러야 CI 에서 되돌아오지 않는다.

---

## 환경 변수

| 변수 | 용도 | 없을 때 |
|---|---|---|
| `VITE_KAKAO_JS_KEY` | 카카오 JavaScript SDK 앱 키 | 카카오 공유 버튼을 숨기고 링크 복사로 폴백한다 |

- Vite 환경변수는 **빌드 시점에 번들에 박힌다.** 이미 만든 번들은 런타임에 바꿀 수 없다.
- 새 변수를 추가하면 `.env.example` 에 함께 기록한다.
- 카카오 SDK 로드 실패나 PC 환경을 대비해 **링크 복사 폴백을 반드시 둔다.** 기획설계 6.3

---

## 커밋 컨벤션

### 커밋 메시지 구조

```
type(scope): 메시지 제목

본문 (선택)

꼬리말 (선택)
```

- 제목은 50자 이내로 작성하며, 마침표 등 특수문자는 사용하지 않는다.
- scope 는 선택 항목이며, 관련된 기능이나 모듈명을 괄호로 작성한다.
- 영어 커밋인 경우, 동사 원형으로 시작하며 첫 글자는 대문자로 작성한다.
- 한글 커밋인 경우, "추가", "수정", "변경" 등의 동사로 시작한다.
- 본문에는 변경 이유나 목적을 간단히 설명한다.
- 관련된 이슈나 설계 문서 절이 있으면 꼬리말에 `Resolves:`, `Related to:` 로 연결한다.

### 커밋 타입

| 타입 | 설명 |
|---|---|
| ✨ Feat | 새로운 기능을 추가한 경우 |
| 🐛 Fix | 버그를 수정한 경우 |
| 🎨 Design | UI 스타일이나 레이아웃 등 시각적 요소를 수정한 경우 |
| 💥 !BREAKING CHANGE | 기존 기능과 호환되지 않는 큰 변경이 있는 경우 |
| 🔥 !HOTFIX | 긴급하게 치명적인 문제를 수정한 경우 |
| 🎯 Style | 포맷팅, 세미콜론 등 기능에 영향을 주지 않는 수정 |
| ♻️ Refactor | 기능 변경 없이 코드 구조를 개선한 경우 |
| 💬 Comment | 주석을 추가하거나 수정한 경우 |
| 📚 Docs | 문서만 수정한 경우 |
| ✅ Test | 테스트 코드를 추가하거나 수정한 경우 |
| 🛠 Chore | 패키지, 설정 등 기능과 직접 관계 없는 작업 |
| 🔄 Rename | 파일/폴더명을 변경한 경우 |
| 🗑 Remove | 파일/폴더를 삭제한 경우 |

### 예시

```
✨ Feat(calc): 항목별 추가 부담 계산 추가

전액 부담과 금액 지정 부담을 하나의 경로로 처리하고,
나눠떨어지지 않는 잔차는 결제자가 흡수하도록 했어요.

Related to: 기획설계 4.1
```
