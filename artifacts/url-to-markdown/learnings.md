---
category: task-ordering
applied: not-yet
---
## url-to-markdown은 plan 순서를 그대로 유지

**상황**: Step 2, Task 의존성 식별 중. `url-input-form`, `url-to-markdown-page`, `export-menu`, `theme-toggle`가 여러 Task에 걸쳐 재사용되지만 plan상 선행 Task가 후행 Task의 UI/상태 기반을 만드는 구조였다.
**판단**: `Task 1 -> 2 -> 3 -> 4 -> 5 -> 6` 순서를 유지했다. 입력 쉘과 상태 컨테이너를 먼저 만들면 이후 Task가 throwaway stub 없이 같은 컴포넌트 위에 적층된다.
**다시 마주칠 가능성**: 중간 — 단일 페이지 feature는 shell-first 순서가 자주 유효하지만, API 선행이 필요한 경우엔 다시 판단이 필요하다.

---
category: refactor
applied: not-yet
---
## 결과 상태 기능은 하나의 vertical slice로 묶어 커밋

**상황**: Step 3 후반, Task 4-6 구현 중. export, prompt handoff, dark mode 검증이 모두 `url-to-markdown-page.tsx`와 `e2e/url-to-markdown.spec.ts`를 공유해 중간 상태를 따로 커밋하면 acceptance 기준이 반쪽만 만족됐다.
**판단**: Task 4-6을 결과 상태 vertical slice 하나로 묶어 완성한 뒤 커밋하기로 했다. commit granularity보다 검증 가능한 사용자 흐름을 우선해 half-finished UI 상태를 남기지 않았다.
**다시 마주칠 가능성**: 중간 — 단일 화면에 상호작용이 적층되는 feature는 task-by-task보다 slice-by-slice commit이 더 안전한 경우가 반복될 수 있다.

---
category: code-review
applied: not-yet
---
## 리뷰에서 나온 안전성 이슈는 서버 경계에서 바로 줄인다

**상황**: Step 4, 독립 리뷰에서 SSRF 가능성, stale result export, 무제한 fetch/LLM query 길이 위험이 Critical/Important로 보고됐다.
**판단**: spec 범위 안에서 바로 수정했다. 서버는 http(s) 외부 HTML만 제한 시간과 크기 상한 안에서 처리하고, 클라이언트는 재변환 시작 시 이전 결과를 비우며, LLM handoff는 긴 query를 toast로 차단했다.
**다시 마주칠 가능성**: 높음 — 외부 URL fetch와 browser handoff는 다른 feature에서도 반복될 가능성이 큰 경계다.
