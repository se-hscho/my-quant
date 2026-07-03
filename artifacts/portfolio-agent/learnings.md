# Portfolio Agent — Learnings

## Task 실행 순서

plan.md 의존성 순서 그대로: Task 1 → 2 → 3 … (my-quant 기존 Next.js 앱 활용, Task 0 스캐폴드 생략)

## Task 1: `/agent` 보유 없음 안내

- **판단**: `useSyncExternalStore`로 localStorage 보유 여부 구독 — SSR에서는 항상 empty, 클라이언트 hydration 후 갱신.
- **applied**: not-yet

## Task 2: 보유 등록 폼

- **판단**: `HoldingsPageContent`가 draft/saved 분리 — 목록은 저장된 스냅샷만 표시 (spec "저장 후").
- **applied**: not-yet
