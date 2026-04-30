---
category: tooling
applied: not-yet
---
## Baseline 정리

**상황**: Step 1, 베이스라인 검증. `bun install` 후 `bun run test`가 e2e/smoke.spec.ts를 Vitest로 잡아 실패. `vitest.config.ts`의 exclude에 `e2e/**`가 빠져 있었음.
**판단**: 베이스라인 차단 이슈라 즉시 수정 (`exclude`에 `e2e/**`, `.next/**` 추가). 디스크 부족(1.4GB)으로 install 실패도 발생 — `node_modules` 제거 후 재시도로 해결.
**다시 마주칠 가능성**: 중간 — 새로운 Next.js + Vitest + Playwright 셋업에서 흔한 함정.
