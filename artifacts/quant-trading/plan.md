# 퀀트 포트폴리오 최적화 대시보드 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 라우트 구조 | `/`, `/bundle/[id]`, `/results/[id]`, `/history`, `/compare` | URL-shareable 결과 화면, 기록에서 직접 접근 가능 |
| 클라이언트 렌더링 | 모든 페이지 `'use client'` wrapper 컴포넌트 | localStorage 의존 → 서버 렌더 불가 |
| 차트 라이브러리 | shadcn `Chart` (Recharts 래퍼) | 프로젝트 shadcn 스택 일관성; ScatterChart, PieChart, LineChart 모두 지원 |
| 최적화 실행 위치 | 브라우저 메인 스레드 | 10,000 포트폴리오 시뮬레이션 충분히 빠름; 필요 시 Web Worker 이전 |
| Yahoo Finance 접근 | `/api/prices` Route Handler 프록시 | 브라우저 직접 호출 시 CORS 차단 가능. 동일 Next.js 배포 내 Route Handler는 "별도 백엔드" 아님 |
| 결과 ID | `crypto.randomUUID()` | 브라우저 내장 API, 추가 의존성 없음 |
| 상태 관리 | React `useState` + `useReducer` | 단일 사용자 앱, 전역 스토어 불필요 |
| localStorage 키 — 임시 결과 | `quant:temp:[id]` | 최적화 완료 즉시 자동 저장; 기록 페이지에 노출 안 됨 |
| localStorage 키 — 명시 저장 | `quant:results:v1` (결과 ID 목록 + 전체 데이터) | "결과 저장" 버튼 클릭 시 이 키에 추가; 버전 접두사로 스키마 변경 시 무효화 용이 |
| localStorage 키 — 캐시 | `quant:cache:{ticker}:{range}` | 당일 자정 TTL |
| `loadResult(id)` 우선순위 | `quant:results:v1` → `quant:temp:[id]` 순서로 조회 | 명시 저장본이 있으면 우선 반환, 없으면 임시본 반환 |

## 인프라 리소스

None

## 데이터 모델

### Stock
- `ticker` string (required)
- `name` string (required)
- `description` string (required)

### Bundle
- `id` string (required)
- `name` string (required)
- `category` `'테마형' | '팩터형' | '전통 배분' | '기관 따라하기'` (required)
- `description` string (required)
- `stocks` Stock[] (required)

### OptimizationMethod
`'max-sharpe' | 'min-variance' | 'risk-parity'`

### PriceCache
- `ticker` string (required)
- `range` string (required)
- `dates` string[] (required)
- `closes` number[] (required)
- `cachedAt` number (required) — `Date.now()`, 당일 자정 만료

### PortfolioPoint
- `weights` `Record<string, number>` (required)
- `expectedReturn` number (required)
- `volatility` number (required)
- `sharpe` number (required)

### PortfolioMetrics
- `annualReturn` number
- `volatility` number
- `sharpe` number
- `mdd` number

### PortfolioResult
- `id` string (required)
- `bundleId` string (required)
- `bundleName` string (required)
- `method` OptimizationMethod (required)
- `tickers` string[] (required)
- `weights` `Record<string, number>` (required)
- `metrics` PortfolioMetrics (required)
- `frontier` PortfolioPoint[] (required)
- `savedAt` string (required) — ISO 8601

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | 2, 5, 6, 7, 8 | HoverCard, Chart(Recharts), Sonner, Skeleton 설치; 컴포넌트 패턴 준수 |
| next-best-practices | 3, 9 | Route Handler 패턴, `useSearchParams` Suspense 경계 |
| vercel-react-best-practices | 5, 8 | `client-localstorage-schema` (버전 관리), `rerender-transitions` |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/index.ts` | New | Task 1 |
| `config/bundles.ts` | New | Task 1 |
| `app/page.tsx` | Modify | Task 1 |
| `app/layout.tsx` | Modify | Task 8 (Toaster 추가) |
| `app/bundle/[id]/page.tsx` | New | Task 2, 5 |
| `app/api/prices/route.ts` | New | Task 3 |
| `app/results/[id]/page.tsx` | New | Task 6, 7, 8 |
| `app/history/page.tsx` | New | Task 8, 9 |
| `app/compare/page.tsx` | New | Task 9 |
| `lib/yahoo-finance.ts` | New | Task 3 |
| `lib/cache.ts` | New | Task 3 |
| `lib/optimization.ts` | New | Task 4 |
| `lib/backtesting.ts` | New | Task 7 |
| `lib/storage.ts` | New | Task 6, 8 |
| `hooks/useOptimization.ts` | New | Task 5 |
| `hooks/useHistory.ts` | New | Task 8 |
| `components/gallery/BundleCard.tsx` | New | Task 1 |
| `components/gallery/BundleCard.test.tsx` | New | Task 1 |
| `components/gallery/BundleGallery.tsx` | New | Task 1 |
| `components/bundle/StockList.tsx` | New | Task 2 |
| `components/bundle/StockList.test.tsx` | New | Task 2 |
| `components/bundle/OptimizationPanel.tsx` | New | Task 2 |
| `components/bundle/OptimizationPanel.test.tsx` | New | Task 2 |
| `components/common/InfoTooltip.tsx` | New | Task 2 |
| `components/common/InfoTooltip.test.tsx` | New | Task 2 |
| `components/optimize/LoadingView.tsx` | New | Task 5 |
| `components/optimize/ErrorView.tsx` | New | Task 5 |
| `components/results/MetricCards.tsx` | New | Task 6 |
| `components/results/MetricCards.test.tsx` | New | Task 6 |
| `components/results/EfficientFrontierChart.tsx` | New | Task 6 |
| `components/results/WeightPieChart.tsx` | New | Task 6 |
| `components/results/BacktestChart.tsx` | New | Task 7 |
| `components/history/HistoryList.tsx` | New | Task 8 |
| `components/history/HistoryList.test.tsx` | New | Task 8 |
| `components/compare/CompareView.tsx` | New | Task 9 |
| `components/compare/CompareView.test.tsx` | New | Task 9 |

## Tasks

### Task 1: 번들 갤러리 — 타입 정의 + 번들 설정 + 갤러리 화면

- **담당 시나리오**: Scenario 1 (full)
- **크기**: M (5 파일)
- **의존성**: None
- **참조**:
  - shadcn — Card, Badge 이미 설치됨
  - wireframe ① 번들 갤러리 화면
- **구현 대상**:
  - `types/index.ts` — Bundle, Stock, OptimizationMethod, PriceCache, PortfolioPoint, PortfolioMetrics, PortfolioResult 타입
  - `config/bundles.ts` — 6개 번들 하드코딩 (AI & 반도체, 빅테크 & 클라우드, Low Volatility, All-Weather, Berkshire Top 10, Quality)
  - `components/gallery/BundleCard.tsx` + `BundleCard.test.tsx`
  - `components/gallery/BundleGallery.tsx` (`'use client'`, 카테고리 필터 + 그리드)
  - `app/page.tsx` — BundleGallery 렌더
- **수용 기준**:
  - [ ] 갤러리 렌더 시 번들 카드가 6개 표시된다
  - [ ] 각 카드에 번들 이름, 카테고리 배지, 포함 종목 수, 한 줄 설명이 보인다
  - [ ] 카테고리 필터("테마형" 등)를 클릭하면 해당 카테고리 번들 카드만 표시된다
  - [ ] "전체" 필터를 클릭하면 모든 카드가 다시 표시된다
- **검증**: `bun run test -- BundleCard BundleGallery`

---

### Task 2: 번들 상세 화면 — 종목 목록 + 최적화 설정 + 툴팁

- **담당 시나리오**: Scenario 2 (full), Scenario 3 (full), Scenario 4 (full)
- **크기**: M (5 파일)
- **의존성**: Task 1 (Bundle, Stock 타입, bundles config)
- **참조**:
  - shadcn — HoverCard 설치 필요: `bunx --bun shadcn@latest add hover-card`
  - shadcn skill — `ToggleGroup` for 최적화 방법 선택 (2–5 options)
  - wireframe ② 번들 상세 화면
- **구현 대상**:
  - `components/common/InfoTooltip.tsx` + `InfoTooltip.test.tsx` — "?" 아이콘 + HoverCard 팝오버, `label`·`description` prop
  - `components/bundle/StockList.tsx` + `StockList.test.tsx` — 종목 카드 목록, 제거 버튼 (2개 이하 시 비활성화), 티커 추가 input + 추가 버튼
  - `components/bundle/OptimizationPanel.tsx` + `OptimizationPanel.test.tsx` — 최적화 방법 라디오 + "최적화 실행" 버튼
  - `app/bundle/[id]/page.tsx` — `'use client'`, URL params에서 번들 로드, 종목 목록 로컬 state
- **수용 기준**:
  - [ ] 번들 ID가 URL에서 읽혀 해당 번들의 종목 목록이 표시된다
  - [ ] 각 종목 카드에 티커, 회사명, 한 줄 설명이 보인다
  - [ ] Max Sharpe / Min Variance / Risk Parity 선택 UI가 표시된다
  - [ ] "?" 아이콘 hover 시 팝오버가 표시된다
  - [ ] 팝오버에 해당 용어의 초보자용 설명 텍스트가 들어 있다
  - [ ] 마우스를 벗어나면 팝오버가 닫힌다
  - [ ] 제거 버튼 클릭 시 해당 종목이 목록에서 사라진다
  - [ ] 종목이 2개일 때 제거 버튼이 모두 비활성화된다
  - [ ] 티커 input에 새 티커를 입력하고 추가 버튼 클릭 시 종목 목록에 추가된다
  - [ ] 제거·추가된 종목 목록이 이후 최적화 실행에 반영된다 (최적화 hook에 수정된 tickers 배열이 전달됨)
- **검증**: `bun run test -- StockList InfoTooltip OptimizationPanel`

---

### Checkpoint: Tasks 1-2 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 갤러리 → 번들 상세 네비게이션이 end-to-end로 동작

---

### Task 3: 데이터 수집 서비스 — Yahoo Finance 프록시 + localStorage 캐시

- **담당 시나리오**: Scenario 5 (데이터 fetch 부분), Scenario 12 (fetch 실패 부분)
- **크기**: M (4 파일)
- **의존성**: Task 1 (PriceCache 타입)
- **참조**:
  - next-best-practices — Route Handler (`app/api/prices/route.ts`)
  - Yahoo Finance endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range={range}`
- **구현 대상**:
  - `app/api/prices/route.ts` — `GET /api/prices?ticker=AAPL&range=10y`, Yahoo Finance 프록시, 에러 핸들링
  - `lib/yahoo-finance.ts` — `/api/prices` 클라이언트 호출, 응답 파싱 (dates, closes 추출)
  - `lib/cache.ts` — `localStorage` 캐시 (`quant:cache:{ticker}:{range}`), TTL 당일 자정 만료
  - `lib/yahoo-finance.test.ts`, `lib/cache.test.ts` — fetch mock 기반 단위 테스트
- **수용 기준**:
  - [ ] GET `/api/prices?ticker=AAPL&range=10y` 호출 시 `{ dates, closes }` 배열이 반환된다
  - [ ] `fetchPrices('AAPL', '10y')` 호출 시 캐시가 없으면 API를 호출하고 localStorage에 저장된다
  - [ ] 같은 티커를 다시 `fetchPrices('AAPL', '10y')` 하면 localStorage 캐시에서 반환된다 (fetch 미호출)
  - [ ] 당일 자정 이후 cachedAt을 가진 캐시는 무효화되어 재요청된다
  - [ ] API 실패 시 `fetchPrices`가 에러를 throw한다
  - [ ] 캐시 히트 경로에서 `fetchPrices` 완료까지 5,000ms 이내다 (performance.now() 측정)
  - [ ] 캐시 미스 + 정상 응답 시 `fetchPrices` 완료까지 10,000ms 이내다 (performance.now() 측정, 네트워크 mocking으로 테스트)
- **검증**: `bun run test -- yahoo-finance cache`

---

### Task 4: 포트폴리오 최적화 알고리즘

- **담당 시나리오**: Scenario 5 (계산 부분), Scenario 6 (frontier 데이터 생성)
- **크기**: M (2 파일)
- **의존성**: Task 1 (PortfolioPoint, PortfolioMetrics, OptimizationMethod 타입)
- **참조**:
  - 공분산 행렬: 일봉 로그 수익률로 계산, 연환산 (×252)
  - 샤프비율: `(E[r] - rf) / σ`, rf = 0 (무위험이자율 근사)
  - MDD: 누적 최댓값 대비 최대 낙폭
  - Risk Parity: 각 자산의 한계 리스크 기여도(MRC)가 동일하도록 반복 수렴
- **구현 대상**:
  - `lib/optimization.ts` — `runOptimization(prices, method)` → `{ optimal, frontier }`, 10,000 Monte Carlo
  - `lib/optimization.test.ts` — 3개 방법 각각 순수 함수 단위 테스트, 지표 계산 검증
- **수용 기준**:
  - [ ] 2개 이상 종목 가격 데이터로 10,000개 포트폴리오 시뮬레이션 결과 배열이 반환된다
  - [ ] Max Sharpe 결과 `weights` 합이 1.0 (±0.001)이고, frontier 내 모든 포트폴리오 중 sharpe가 최대다
  - [ ] Min Variance 결과 `weights` 합이 1.0 (±0.001)이고, frontier 내 volatility가 최소다 (±1%)
  - [ ] Risk Parity 결과 각 종목 리스크 기여도의 최대-최솟값 차이가 5% 이하다
  - [ ] `calcMetrics` 함수가 연환산 수익률, 변동성, 샤프비율, MDD를 올바르게 반환한다
- **검증**: `bun run test -- optimization`

---

### Checkpoint: Tasks 3-4 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 알고리즘 단위 테스트로 3개 최적화 방법 모두 검증됨

---

### Task 5: 최적화 실행 흐름 — 로딩 + 에러 상태

- **담당 시나리오**: Scenario 5 (full), Scenario 12 (full)
- **크기**: M (4 파일)
- **의존성**: Task 2 (번들 상세 페이지), Task 3 (fetchPrices), Task 4 (runOptimization)
- **참조**:
  - shadcn — Skeleton 설치: `bunx --bun shadcn@latest add skeleton`
  - vercel-react-best-practices — `rerender-transitions` (useTransition for loading)
  - wireframe ③ 실행 중, ⑦ 에러 상태
- **구현 대상**:
  - `hooks/useOptimization.ts` — fetch → cache check → optimize → `crypto.randomUUID()` 결과를 `quant:temp:[id]`(localStorage)에 자동 저장 → `router.push('/results/' + id)`, 단계 메시지 state, 에러 state
  - `components/optimize/LoadingView.tsx` — 스피너 + 단계 메시지 순차 표시 (`데이터 가져오는 중...` → `계산 중...` → `결과 준비 중...`)
  - `components/optimize/ErrorView.tsx` — 에러 메시지 + 재시도 버튼
  - `app/bundle/[id]/page.tsx` 수정 — useOptimization 연결, 조건부 LoadingView/ErrorView 렌더
- **수용 기준**:
  - [ ] "최적화 실행" 클릭 즉시 로딩 스피너가 표시된다
  - [ ] "데이터 가져오는 중..." 메시지가 표시된다
  - [ ] "계산 중..." 메시지가 표시된다
  - [ ] 완료 후 `/results/[id]` 화면으로 전환된다
  - [ ] 데이터 수집 실패 시 "데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요." 메시지가 표시된다
  - [ ] 재시도 버튼이 표시된다
  - [ ] 재시도 버튼 클릭 시 최적화를 다시 실행한다
- **검증**:
  - `bun run test -- useOptimization` (mocked fetchPrices, runOptimization)
  - Browser MCP — `/bundle/ai-semiconductor` → "최적화 실행" 클릭 → 로딩 메시지 순차 확인 → 결과 화면 전환 확인, 증거 `artifacts/quant-trading/evidence/task-5-flow.png` 저장

---

### Task 6: 결과 화면 — 효율적 프론티어 + 핵심 지표 + 가중치 파이차트

- **담당 시나리오**: Scenario 6 (full), Scenario 7 (full)
- **크기**: M (5 파일)
- **의존성**: Task 4 (PortfolioResult 타입), Task 5 (sessionStorage에 결과 저장)
- **참조**:
  - shadcn — Chart 설치: `bunx --bun shadcn@latest add chart` (Recharts ScatterChart, PieChart)
  - wireframe ④ 최적화 결과 화면
- **구현 대상**:
  - `lib/storage.ts` — `loadResult(id)`: `quant:results:v1` 우선 조회 → 없으면 `quant:temp:[id]` 조회
  - `components/results/MetricCards.tsx` + `MetricCards.test.tsx` — 4개 지표 카드 (연환산 수익률, 변동성, 샤프비율, MDD) + InfoTooltip
  - `components/results/EfficientFrontierChart.tsx` — Recharts ScatterChart, 최적점 다른 색·크기 강조, X/Y 레이블
  - `components/results/WeightPieChart.tsx` — Recharts PieChart, 종목별 가중치 범례
  - `app/results/[id]/page.tsx` — `'use client'`, `loadResult(id)` 로드, MetricCards + EfficientFrontierChart + WeightPieChart 렌더
- **수용 기준**:
  - [ ] 결과 화면에 효율적 프론티어 산점도가 표시된다
  - [ ] 최적 포트폴리오 점이 다른 색·크기로 강조 표시된다
  - [ ] X축 "변동성", Y축 "기대수익률" 레이블이 표시된다
  - [ ] 연환산 수익률, 변동성, 샤프비율, MDD 4개 지표 카드가 모두 표시된다
  - [ ] 각 지표 카드 옆에 "?" 아이콘이 표시된다
  - [ ] 가중치 파이차트가 표시된다
- **검증**:
  - `bun run test -- MetricCards`
  - Browser MCP — 결과 화면 시각 확인 (차트·지표 카드 표시), 증거 `artifacts/quant-trading/evidence/task-6-results.png` 저장

---

### Task 7: 백테스팅 차트

- **담당 시나리오**: Scenario 8 (full)
- **크기**: S (3 파일)
- **의존성**: Task 3 (가격 데이터), Task 6 (결과 화면 존재)
- **참조**:
  - 백테스팅: 선택된 최적 weights로 일봉 수익률 재구성, Buy & Hold는 동일 비중 기준
  - Recharts LineChart (Task 6에서 Chart 이미 설치됨)
  - wireframe ④ 백테스팅 섹션
- **구현 대상**:
  - `lib/backtesting.ts` + `lib/backtesting.test.ts` — `calcBacktest(prices, weights, range)` → `{ dates, optimalReturns, buyHoldReturns }`
  - `components/results/BacktestChart.tsx` — Recharts LineChart, 1년/3년/5년/10년 프리셋 ToggleGroup, 두 수익률 곡선 + 범례
  - `app/results/[id]/page.tsx` 수정 — BacktestChart 추가
- **수용 기준**:
  - [ ] 1년/3년/5년/10년 프리셋 버튼이 표시된다
  - [ ] 프리셋 선택 시 두 수익률 곡선이 하나의 차트에 표시된다
  - [ ] 범례에 "최적 포트폴리오"와 "Buy & Hold"가 구분 표시된다
- **검증**:
  - `bun run test -- backtesting`
  - Browser MCP — 결과 화면에서 기간 프리셋 클릭 → 두 곡선 확인, 증거 `artifacts/quant-trading/evidence/task-7-backtest.png` 저장

---

### Checkpoint: Tasks 5-7 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 갤러리 → 번들 상세 → 최적화 실행 → 결과 확인 전체 흐름이 end-to-end로 동작

---

### Task 8: 결과 저장 + 기록 페이지

- **담당 시나리오**: Scenario 9 (full), Scenario 10 (full)
- **크기**: M (5 파일)
- **의존성**: Task 6 (결과 화면, PortfolioResult 구조)
- **참조**:
  - shadcn — Sonner 설치: `bunx --bun shadcn@latest add sonner` + `app/layout.tsx`에 `<Toaster>` 추가
  - vercel-react-best-practices — `client-localstorage-schema` (버전 키 `quant:results:v1`)
  - wireframe ⑤ 기록 페이지
- **구현 대상**:
  - `lib/storage.ts` 확장 — `saveResult(result)`: `quant:temp:[id]` → `quant:results:v1` 목록에 추가 (두 곳 모두 유지), `listResults()` (최신순, `quant:results:v1`만 반환)
  - `hooks/useHistory.ts` — 기록 목록 로드, 체크박스 선택 state (최대 2개)
  - `components/history/HistoryList.tsx` + `HistoryList.test.tsx` — 최신순 목록, 체크박스, 체크 2개 → "비교하기" 버튼 활성화
  - `app/history/page.tsx` — `'use client'`, HistoryList 렌더
  - `app/results/[id]/page.tsx` 수정 — "결과 저장" 버튼, `saveResult()` 호출, `toast("저장됨")`, `app/layout.tsx`에 Toaster 추가
- **수용 기준**:
  - [ ] "결과 저장" 버튼이 결과 화면에 표시된다
  - [ ] 버튼 클릭 시 "저장됨" 토스트 메시지가 표시된다
  - [ ] 저장 후 기록 페이지 목록에 해당 결과가 나타난다
  - [ ] 저장된 결과가 최신순으로 표시된다
  - [ ] 각 항목에 번들명, 최적화 방법, 저장 일시가 표시된다
  - [ ] 항목 클릭 시 해당 결과 화면(`/results/[id]`)이 표시된다
- **검증**:
  - `bun run test -- storage HistoryList`
  - Browser MCP — 결과 저장 → 기록 페이지 이동 → 항목 확인, 증거 `artifacts/quant-trading/evidence/task-8-history.png` 저장

---

### Task 9: 비교 화면

- **담당 시나리오**: Scenario 11 (full)
- **크기**: M (3 파일)
- **의존성**: Task 8 (기록 페이지, `listResults()`, WeightPieChart 재사용)
- **참조**:
  - next-best-practices — `useSearchParams` → Suspense 경계 필요 (`app/compare/page.tsx`에서 `<Suspense fallback>` 래핑)
  - wireframe ⑥ 비교 화면
- **구현 대상**:
  - `components/compare/CompareView.tsx` + `CompareView.test.tsx` — 두 PortfolioResult 받아 핵심 지표 + WeightPieChart 나란히
  - `app/compare/page.tsx` — `'use client'`, `useSearchParams`로 `?a=&b=` 읽기, `<Suspense>` 래핑, `loadResult()` 두 번 호출
  - `app/history/page.tsx` 수정 — 2개 선택 시 "비교하기" 버튼 활성화 → `/compare?a=...&b=...` push
- **수용 기준**:
  - [ ] 기록 페이지에서 결과를 2개까지 체크박스로 선택할 수 있다
  - [ ] 2개 선택 시 "비교하기" 버튼이 활성화된다
  - [ ] 비교 화면에 두 결과의 핵심 지표(연환산 수익률, 변동성, 샤프비율, MDD)가 나란히 표시된다
  - [ ] 비교 화면에 두 결과의 가중치 파이차트가 나란히 표시된다
- **검증**:
  - `bun run test -- CompareView`
  - Browser MCP — 기록에서 2개 선택 → 비교 화면 → 지표 및 파이차트 확인, 증거 `artifacts/quant-trading/evidence/task-9-compare.png` 저장

---

### Checkpoint: Tasks 8-9 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 갤러리 → 최적화 → 결과 저장 → 기록 → 비교 전체 흐름 end-to-end 동작
- [ ] Human review — 성능: 로컬 캐시 있을 때 결과 표시 5초 이내, 첫 데이터 수집 10초 이내 (타이머로 측정)

---

## 미결정 항목

- 리스크 성향 설문 → 맞춤 번들 추천: spec에서 MVP 제외로 마킹됨. 향후 Task로 추가 가능.
