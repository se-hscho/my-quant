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
applied: rule
---
## React 19 act 환경 설정

**상황**: Step 3, Task 5 useOptimization 훅 테스트 작성. `renderHook` 사용 시 "The current testing environment is not configured to support act(...)" 에러 + `act(() => ...)`만 쓰면 비동기 본체가 끝나기 전에 assertion이 실행됨.
**판단**: `vitest.setup.ts`에 `globalThis.IS_REACT_ACT_ENVIRONMENT = true` 추가하고 모든 비동기 hook 호출은 `await act(async () => { await result.current.run(); })`로 감싸도록 변경.
**다시 마주칠 가능성**: 높음 — 이 프로젝트의 모든 클라이언트 hook 테스트에 동일 패턴이 필요하다. → 즉시 승격 후보.

---
category: api-integration
applied: rule
---
## Yahoo Finance API는 항상 adjclose 사용

**상황**: 코드 리뷰에서 pp/api/prices/route.ts가 indicators.quote[0].close(원시 종가)를 쓰고 있어 발견됨. 10년 윈도에서 NVDA 10:1, AAPL 4:1 등 split이 단일일 -90% 수익률로 들어가 mean/cov/Sharpe/MDD/백테스트가 전부 왜곡됨. 배당주(JNJ, KO 등)는 총수익 과소계상.
**판단**: indicators.adjclose[0].adjclose(분할·배당 보정)로 전환. 캐시 prefix를 quant:cache: → quant:cache:v2:로 bump해서 기존 raw close 캐시 무효화.
**다시 마주칠 가능성**: 매우 높음 — Yahoo Finance를 쓰는 모든 향후 quant feature의 함정. → 즉시 승격해야 함.

---
category: ui-library
applied: rule
---
## Recharts는 ResponsiveContainer 또는 명시적 width/height 필수

**상황**: EfficientFrontierChart, BacktestChart에서 <ScatterChart width={undefined} height={undefined} />를 부모 div의 Tailwind 클래스(\h-[360px] w-full\)에 의존시킴. JSDOM 테스트는 통과했지만 실제 브라우저에선 SVG가 0×0으로 렌더되어 spec scenario 6/7/8의 "차트 표시" 기준이 깨짐.
**판단**: 두 차트 모두 <ResponsiveContainer width="100%" height="100%">로 감쌈. 렌더링은 build/test로 확인 불가능 — 시각 검증이 필수인 부분이 단위 테스트 수용 기준에서 누락됐다는 의미.
**다시 마주칠 가능성**: 높음 — Recharts 쓰는 모든 차트. → 즉시 승격.

---
category: data-modeling
applied: not-yet
---
## localStorage에 저장하는 객체는 직렬화 크기 산정 필수

**상황**: unOptimization이 10,000개 frontier 샘플마다 weights: Record<ticker, number>를 매달았다. 결과 1건당 약 1.5–2 MB. 5MB 쿼터에서 2–3회 저장 시 QuotaExceededError 발생, saveResult가 throw하면 toast.success가 실행되지 않아 사용자에게 "저장됨"인지 실패인지 모름.
**판단**: frontier 샘플에서 weights 제거 (PortfolioPoint.weights를 optional로). saveResult가 status 반환하도록 변경 → ResultView가 toast.info / toast.error로 분기.
**다시 마주칠 가능성**: 중간 — 시뮬레이션·이력 저장 패턴이 있는 모든 feature.

---
category: process
applied: not-yet
---
## Browser MCP 부재 시 시각 회귀는 단위 테스트로 잡히지 않는다

**상황**: 플랜이 Tasks 5–9에 Browser MCP 시각 검증을 명시했으나 환경에 도구가 없어 build+vitest로만 진행. Recharts ResponsiveContainer 누락이 그래서 코드 리뷰 단계까지 발견되지 않음.
**판단**: 차트·레이아웃·motion 등 시각 의존 기준은 Playwright 스냅샷 또는 사용자 검증 게이트로 보강해야 한다. 다음 feature에선 Browser MCP 부재를 사전에 인지하고 차트 컨테이너 패턴을 처음부터 적용.
**다시 마주칠 가능성**: 중간 — UI 비중이 큰 feature 전반.

