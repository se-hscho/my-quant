# custom-bundle learnings

## Task 실행 순서

Task 1 (저장소 레이어) → Task 2 (CreateBundleDialog) → Task 3 (갤러리 통합) → Task 4 (상세 페이지)

의존성 기반 순서가 올바름. Task 1이 없으면 2·3·4가 import 불가.

---

## 발견 및 판단

---
category: react-pattern
applied: not-yet
---
### notFound()는 useEffect 안에서 호출한다

**상황**: Task 4에서 `bundle === null`일 때 render 함수 본체에서 `notFound()`를 호출. code-reviewer가 Critical로 지적 — React 18/19에서 render 중 throw가 부분 커밋을 일으킬 수 있음.

**판단**: `useEffect(() => { if (bundle === null) notFound(); }, [bundle])` 로 이동. render에서는 `if (bundle === undefined || bundle === null) return null`로만 처리.

테스트에서 notFound mock을 throw하지 않는 spy로 변경 → `toHaveBeenCalled()`로 검증.

**다시 마주칠 가능성**: 높음 — useEffect 패턴을 쓰는 모든 client component에서 notFound/redirect 호출 시 동일 패턴.

---
category: ux-bug
applied: not-yet
---
### 카테고리 필터 리셋 — 마지막 번들 삭제 후 빈 화면

**상황**: Task 3 이후 code-reviewer가 Important로 지적. 활성 필터가 "내 전략"인 상태에서 마지막 "내 전략" 번들을 삭제하면 filter state는 "내 전략"으로 남지만 카테고리 목록에서 "내 전략"이 사라져 빈 화면 + 복구 불가.

**판단**: `handleDelete` 내에서 next 목록을 재계산한 후 현재 filter가 업데이트된 카테고리 목록에 없으면 "전체"로 리셋.

**다시 마주칠 가능성**: 중간 — 동적 필터 목록 + 삭제 기능 조합이 있는 곳에서 일반적인 함정.

---
category: a11y
applied: not-yet
---
### 클릭 전용 Badge는 키보드 접근 불가

**상황**: CreateBundleDialog의 ticker 삭제 — `<Badge onClick={...}>` 패턴. Badge는 div로 렌더되어 키보드 포커스·Enter/Space가 작동하지 않음.

**판단**: Badge 내부의 XIcon을 `<button type="button" aria-label={...}>` 으로 감쌈.

**다시 마주칠 가능성**: 높음 — 클릭 핸들러를 non-interactive element에 붙이는 패턴은 항상 이 함정에 빠짐.

---
category: implementation-delta
applied: not-yet
---
### plan의 Combobox를 datalist로 대체

**상황**: plan.md에 카테고리 입력으로 Combobox(components/ui/combobox.tsx) 사용을 명시. 구현 시 `<Input list="...">` + `<datalist>`로 대체 — 자유 텍스트 입력 + 제안 목록을 더 단순하게 제공.

**판단**: 기능적으로 동등(기존 카테고리 제안 + 자유 입력 모두 가능), 코드량 감소, 별도 상태 불필요. 기각.

---

## 무엇이 잘 됐는가

- TDD RED→GREEN 흐름이 전 Task에서 일관되게 적용됨. 테스트 먼저 작성 → 구현으로 수용 기준이 명확히 증명됨.
- `deleteCustomBundle`의 `isCustom` guard를 test에서 직접 localStorage 조작으로 검증 — 구현 상세에 의존하지 않는 경계 테스트.
- SSR/localStorage 경계를 라이브러리 계층(`typeof localStorage` 가드)에 두고 컴포넌트는 `useEffect`만 책임지는 일관된 분리.
- code-reviewer가 6개 Important 이슈를 찾아 모두 수정 후 머지 — 리뷰가 실제 품질을 올림.

## 무엇이 안 됐는가

- plan의 `createdAt` 필드가 구현에서 빠짐 — 데이터 모델 항목이 수용 기준에 없으면 구현 시 누락됨. 수용 기준에 포함하거나 plan에 명시적 제외 이유를 달아야 함.
- `notFound()` 위치(render vs useEffect)가 code-review 전까지 Critical로 인식되지 않음. Next.js 원본 코드 패턴(sync render notFound)을 그대로 재사용했기 때문.

## 다음에도 쓸 인사이트

1. **client component에서 notFound/redirect는 항상 useEffect 안에서 호출한다** — render 본체에서는 return null만.
2. **동적 필터 + 삭제 조합에서 항상 필터 리셋 로직을 함께 작성한다** — 단독 테스트보다 통합 시나리오 테스트가 이를 잡는다.
3. **클릭 핸들러는 반드시 interactive element(button, a)에 붙인다** — div/span/Badge에 onClick은 a11y 함정.
