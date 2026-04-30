---
category: tooling
applied: not-yet
---
## Baseline 정리

**상황**: Step 1, 베이스라인 검증. `bun install` 후 `bun run test`가 e2e/smoke.spec.ts를 Vitest로 잡아 실패. `vitest.config.ts`의 exclude에 `e2e/**`가 빠져 있었음.
**판단**: 베이스라인 차단 이슈라 즉시 수정 (`exclude`에 `e2e/**`, `.next/**` 추가). 디스크 부족(1.4GB)으로 install 실패도 발생 — `node_modules` 제거 후 재시도로 해결.
**다시 마주칠 가능성**: 중간 — 새로운 Next.js + Vitest + Playwright 셋업에서 흔한 함정.

---
category: tooling
applied: not-yet
---
## React 19 act 환경 설정

**상황**: Step 3, Task 5 useOptimization 훅 테스트 작성. `renderHook` 사용 시 "The current testing environment is not configured to support act(...)" 에러 + `act(() => ...)`만 쓰면 비동기 본체가 끝나기 전에 assertion이 실행됨.
**판단**: `vitest.setup.ts`에 `globalThis.IS_REACT_ACT_ENVIRONMENT = true` 추가하고 모든 비동기 hook 호출은 `await act(async () => { await result.current.run(); })`로 감싸도록 변경.
**다시 마주칠 가능성**: 높음 — 이 프로젝트의 모든 클라이언트 hook 테스트에 동일 패턴이 필요하다. → 즉시 승격 후보.
