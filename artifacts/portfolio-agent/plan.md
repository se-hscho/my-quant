# 포트폴리오 관리 에이전트 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 구현 위치 | `my-quant` 앱 내 `/agent` 라우트 그룹 | spec·wireframe이 동일 앱 분리 UI를 전제. 기존 Yahoo 시세·Recharts·shadcn·KV 재사용 |
| 보유·설정 저장 | `localStorage` (`agent:holdings:v1`, `agent:settings:v1`) | 기존 `lib/storage.ts` 패턴·단일 사용자 MVP와 일치 |
| 브리핑·히스토리 저장 | Vercel KV (`agent:briefing:{date}`, `agent:briefing:index`) | Cron·알림·히스토리가 서버 측 필요. KV 미설정 시 생성 실패 → Scenario 23 |
| 시세·환율 | 기존 `/api/prices` 확장 + `USDKRW=X`, `JPYKRW=X` | Yahoo chart API 이미 검증됨. 일봉 기준 spec 준수 |
| 스마트 머니 (MVP) | `services/smart-money/` 어댑터 + **fixture** 기본값 | KRX 공식 소스 미확정. 인터페이스 고정 후 실데이터 교체 |
| 애널 리포트 (MVP) | 수동 시드 JSON + 어댑터 인터페이스 | 유료·크롤링 리스크 회피. 공개 요약만 spec 준수 |
| AI narrative·채팅 | Gemini API (`@google/generative-ai`) 서버 Route Handler | idea.md 권장. API 키는 서버 env only |
| 이메일 | Resend API | Vercel 친화적. `RESEND_API_KEY` 없으면 이메일 채널 비활성 |
| Slack | Incoming Webhook (사용자 설정 URL) | spec 그대로. 서버에서 POST |
| 정기 브리핑 | Vercel Cron `0 22 * * *` (UTC) ≈ 07:00 KST | `vercel.json` cron + `/api/agent/cron/daily` |
| 이벤트 즉시 알림 | 브리핑 재생성 후 `after()` 비동기 발송 | next-best-practices `after()` 패턴 |
| 예상 수익률 가중 | 7d 40% · 1mo 35% · 분기 25% | spec 미결정 — 초기 고정값, `config/agent.ts`에서 조정 |
| 환전 스프레드 | 기본 0.3% (`config/agent.ts`) | spec 미결정 — MVP 고정 %, 설정 화면 확장은 후속 |
| UI 컴포넌트 | shadcn/ui + Recharts + `InfoTooltip` 재사용 | wireframe 9화면, 기존 `components/ui/*`·`components/common/InfoTooltip.tsx` |
| RSC 경계 | 페이지 shell = RSC, 폼·차트·채팅 = Client | next-best-practices RSC boundary 준수 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `GEMINI_API_KEY` | Env var | Vercel project settings | Task 12 |
| `RESEND_API_KEY`, `RESEND_FROM` | Env var | Vercel project settings | Task 18 |
| `CRON_SECRET` | Env var | Vercel project settings | Task 18 |
| `KV_*` (기존) | Storage | Vercel KV | Task 5 |
| Daily briefing cron | Cron job | `vercel.json` | Task 18 |
| Event webhook handler | Route Handler | `app/api/agent/notify/event/route.ts` | Task 19 |

## 데이터 모델

### Holding
- `id` (required)
- `ticker` (required)
- `quantity` (required, > 0)
- `assetType`: `stock` | `etf` | `bond_etf` | `gold_etf` (required)
- `currency`: `KRW` | `USD` | `JPY` (required)
- `sector` (optional — Scenario 4에서 필수화)
- `region`: `KR` | `US` | `JP` (optional, 티커로 추론 실패 시)

### CashBalances
- `krw`, `usd`, `jpy` (required, ≥ 0)

### HoldingsSnapshot
- `holdings` → Holding[]
- `cash` → CashBalances
- `updatedAt` (required)

### BriefingScenario
- `id`: `0` | `1` | `2` | `3`
- `label`: 유지 | Follow | 선점 | 최소변경
- `expectedReturn`, `expectedVolatility` (참고용)
- `assetReturn`, `fxImpact` (KRW 기준, Scenario 10)
- `weightsBefore`, `weightsAfter` → Record<ticker, number>
- `cashAfter` → CashBalances
- `playbook` → PlaybookStep[]

### PlaybookStep
- `order` (required)
- `action`: `fx` | `sell` | `buy` | `hold`
- `ticker` (optional)
- `deltaPp` (optional)
- `currency` (required)
- `note` (optional)

### Briefing
- `date` (YYYY-MM-DD, required)
- `summaryLines` (string[], 3–5)
- `totalAssetsKrw`, `cash`, `sectorTop3`, `scenarioComparison`
- `sections`: portfolio | fx | smartMoney | sectorFlows | context | events | institutional | recommendations | scenarios | diff
- `disclaimer` (required)
- `status`: `complete` | `failed` | `partial`

### NotificationSettings
- `emailEnabled`, `emailAddress`
- `slackEnabled`, `slackWebhookUrl`
- `morningTimeKst` (default `07:00`)

### AnalystReport (public summary only)
- `ticker`, `broker`, `date`, `rating`, `targetPrice`, `summary`, `sourceUrl?`

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | 전체 | App Router, RSC, Route Handler, `after()`, cron |
| shadcn | Task 1–4, 6–7, 16–17 | Card, Form, Dialog, Chart, Toggle |
| vercel-react-best-practices | Task 5–15 | 병렬 fetch, Suspense, bundle 직접 import |
| vercel-composition-patterns | Task 6–7, 20 | Briefing compound components, Provider |
| execute-plan | 구현 단계 | Task별 TDD·커밋 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/agent.ts` | New | Task 1 |
| `config/agent.ts` | New | Task 5 |
| `lib/agent/holdings-storage.ts` | New | Task 1–3 |
| `lib/agent/holdings-storage.test.ts` | New | Task 1–3 |
| `lib/agent/valuation.ts` | New | Task 4 |
| `lib/agent/valuation.test.ts` | New | Task 4 |
| `lib/yahoo-finance.ts` | Modify | Task 4 |
| `app/api/prices/route.ts` | Modify | Task 4 |
| `app/api/fx/route.ts` | New | Task 4 |
| `services/briefing/types.ts` | New | Task 5 |
| `services/briefing/generate.ts` | New | Task 5–15 |
| `services/briefing/generate.test.ts` | New | Task 5–15 |
| `services/briefing/kv.ts` | New | Task 5 |
| `services/smart-money/adapter.ts` | New | Task 11 |
| `services/analyst/adapter.ts` | New | Task 13 |
| `services/context/adapter.ts` | New | Task 12 |
| `services/events/adapter.ts` | New | Task 14 |
| `services/ai/gemini.ts` | New | Task 12, 20 |
| `services/notifications/email.ts` | New | Task 18–19 |
| `services/notifications/slack.ts` | New | Task 18–19 |
| `components/agent/*` | New | Task 1–23 |
| `app/agent/layout.tsx` | New | Task 1 |
| `app/agent/page.tsx` | New | Task 1, 6 |
| `app/agent/holdings/page.tsx` | New | Task 2–3 |
| `app/agent/report/[date]/page.tsx` | New | Task 7–15 |
| `app/agent/history/page.tsx` | New | Task 16 |
| `app/agent/settings/page.tsx` | New | Task 17 |
| `app/agent/chat/page.tsx` | New | Task 20 |
| `app/api/agent/briefing/route.ts` | New | Task 5 |
| `app/api/agent/briefing/[date]/route.ts` | New | Task 5, 16 |
| `app/api/agent/chat/route.ts` | New | Task 20 |
| `app/api/agent/cron/daily/route.ts` | New | Task 18 |
| `app/api/agent/notify/event/route.ts` | New | Task 19 |
| `lib/agent/settings-storage.ts` | New | Task 17 |
| `vercel.json` | New/Modify | Task 18 |
| `e2e/agent.spec.ts` | New | Checkpoint 3 |

## Tasks

### Task 1: `/agent` 진입 — 보유 없음 안내

- **담당 시나리오**: Scenario 22 (full)
- **크기**: M (4–5 파일)
- **의존성**: None
- **참조**:
  - shadcn — Card, Button
  - wireframe 화면④ (`screen-3`)
  - `lib/storage.ts` — localStorage 패턴
- **구현 대상**:
  - `types/agent.ts`
  - `lib/agent/holdings-storage.ts` + `.test.ts`
  - `app/agent/layout.tsx`, `app/agent/page.tsx`
  - `components/agent/EmptyHoldingsState.tsx` + `.test.tsx`
- **수용 기준**:
  - [x] 보유가 비어 있을 때 `/agent`에 접속하면 보유 미등록 안내 문구가 표시된다
  - [x] 같은 화면에서 보유 편집(`/agent/holdings`)으로 이동하는 버튼 또는 링크가 보인다
- **검증**: `bun run test -- holdings-storage EmptyHoldingsState`

---

### Task 2: 보유 자산·통화별 현금 수동 등록

- **담당 시나리오**: Scenario 3 (full)
- **크기**: M (4–5 파일)
- **의존성**: Task 1 (holdings storage)
- **참조**:
  - shadcn — Form, Input, Select
  - wireframe 화면③ (`screen-2`)
- **구현 대상**:
  - `app/agent/holdings/page.tsx`
  - `components/agent/HoldingsEditor.tsx` + `.test.tsx`
  - `components/agent/HoldingsList.tsx` + `.test.tsx`
- **수용 기준**:
  - [x] 티커·수량·자산 유형·결제 통화를 입력하는 폼이 있다
  - [x] KRW·USD·JPY 현금을 각각 입력할 수 있다
  - [x] 저장 후 보유 목록에 종목과 통화별 현금이 표시된다
  - [x] 총자산 금액(KRW 환산) placeholder 또는 "시세 로딩 중"이 화면에 표시된다 (정확한 금액은 Task 4)
- **검증**: `bun run test -- HoldingsEditor HoldingsList`

---

### Task 3: 알 수 없는 티커 — 섹터 태그 지정

- **담당 시나리오**: Scenario 4 (full)
- **크기**: S (2–3 파일)
- **의존성**: Task 2
- **참조**:
  - shadcn — Dialog, Select
  - `config/agent.ts` — 섹터 목록
- **구현 대상**:
  - `lib/agent/sector-classify.ts` + `.test.ts`
  - `components/agent/SectorTagDialog.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 자동 분류에 실패한 티커 저장 시도 시 섹터 선택 UI가 표시된다
  - [ ] 섹터 지정 후 저장하면 보유 목록에 해당 섹터 정보가 표시된다
- **검증**: `bun run test -- sector-classify SectorTagDialog`

---

### Checkpoint: Tasks 1–3 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 보유 없음 → 편집 → 저장 → 목록 표시 end-to-end 동작

---

### Task 4: 시세·환율 조회 및 총자산 KRW 환산

- **담당 시나리오**: Scenario 3 (총자산 갱신 부분)
- **크기**: M (4–5 파일)
- **의존성**: Task 2
- **참조**:
  - vercel-react-best-practices — Promise.all 병렬 fetch
  - `app/api/prices/route.ts`, `lib/yahoo-finance.ts`
- **구현 대상**:
  - `app/api/fx/route.ts`
  - `lib/agent/valuation.ts` + `.test.ts`
  - `lib/yahoo-finance.ts` (FX ticker 지원)
  - `components/agent/PortfolioValueCard.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 보유 종목 저장 후 총자산(KRW 환산) 숫자가 화면에 표시된다
  - [ ] KRW·USD·JPY 현금 잔액이 함께 표시된다
- **검증**: `bun run test -- valuation PortfolioValueCard`

---

### Task 5: 브리핑 생성 API — 성공·실패·재시도

- **담당 시나리오**: Scenario 23 (full), Scenario 1·7 선행 인프라
- **크기**: M (5 파일)
- **의존성**: Task 4, KV env
- **참조**:
  - next-best-practices — Route Handler, error mapping
  - `lib/kv.ts`
  - wireframe 화면⑨ (`screen-8`)
- **구현 대상**:
  - `config/agent.ts`
  - `services/briefing/types.ts`, `services/briefing/kv.ts`, `services/briefing/generate.ts` + `.test.ts`
  - `app/api/agent/briefing/route.ts` (POST generate)
  - `components/agent/BriefingErrorState.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 외부 데이터 수집 실패 시 "브리핑을 생성하지 못했습니다" 안내가 표시된다
  - [ ] 재시도 버튼이 표시된다
  - [ ] 실패 상태에서 불완전한 시나리오 안 0~3이 완성본처럼 표시되지 않는다
- **검증**: `bun run test -- briefing/generate BriefingErrorState` · generate API mock에서 503 유도

---

### Task 6: 요약 페이지 — 30초 스캔

- **담당 시나리오**: Scenario 1 (full)
- **크기**: M (5 파일)
- **의존성**: Task 5 (완전 브리핑), Task 4
- **참조**:
  - vercel-composition-patterns — BriefingProvider
  - wireframe 화면① (`screen-0`)
  - shadcn — Chart (Recharts)
- **구현 대상**:
  - `components/agent/BriefingProvider.tsx`
  - `components/agent/SummaryPage.tsx` + `.test.tsx`
  - `components/agent/ScenarioCompareChart.tsx` + `.test.tsx`
  - `components/agent/SectorTop3Chart.tsx` + `.test.tsx`
  - `app/agent/page.tsx` (브리핑 있을 때 요약 렌더)
- **수용 기준**:
  - [ ] 요약 페이지에 오늘 결론 텍스트가 3줄 이상 표시된다
  - [ ] 총자산(KRW 환산)과 KRW/USD/JPY 현금이 표시된다
  - [ ] 섹터 자금 흐름 상위 3개가 표 또는 차트로 표시된다
  - [ ] 시나리오 안 0~3의 예상 수익률·변동성 비교 시각 요소가 1개 이상 있다
  - [ ] 환전 또는 리밸런싱 시점 요약이 1줄 이상 표시된다
  - [ ] 상세 레포트로 이동하는 링크 또는 UI가 보인다
  - [ ] 요약 페이지 하단에 "예상 수익률·제안은 참고용이며 투자 권유가 아닙니다" 면책 문구가 표시된다
- **검증**: `bun run test -- SummaryPage ScenarioCompareChart SectorTop3Chart`

---

### Task 7: 상세 레포트 — 골격·면책·툴팁·포트 스냅샷

- **담당 시나리오**: Scenario 2 (partial — 섹션 골격·스냅샷·면책)
- **크기**: M (5 파일)
- **의존성**: Task 6
- **참조**:
  - `components/common/InfoTooltip.tsx`
  - wireframe 화면② (`screen-1` 상단)
- **구현 대상**:
  - `app/agent/report/[date]/page.tsx`
  - `components/agent/ReportLayout.tsx` + `.test.tsx`
  - `components/agent/sections/PortfolioSnapshotSection.tsx` + `.test.tsx`
  - `components/agent/DisclaimerFooter.tsx`
- **수용 기준**:
  - [ ] 상세 레포트에 구분된 섹션 영역이 2개 이상 있다 (이 Task에서 포트 스냅샷 포함)
  - [ ] 포트 스냅샷 섹션에 차트 또는 표가 1개 이상 있다
  - [ ] 차트·표 아래 해석 문단이 2문장 이상 있다
  - [ ] %p·Follow 등 용어에 초보자용 ? 툴팁이 1곳 이상 있다
  - [ ] 면책 문구가 상세 레포트 하단에 표시된다
- **검증**: `bun run test -- ReportLayout PortfolioSnapshotSection`

---

### Task 8: 상세 — 전 섹터 흐름·미보유 추천·시나리오 Before/After

- **담당 시나리오**: Scenario 5 (full), Scenario 6 (full), Scenario 7 (full)
- **크기**: M (5 파일)
- **의존성**: Task 7
- **참조**:
  - wireframe — 섹터 흐름·신규 추천·시나리오 표
- **구현 대상**:
  - `components/agent/sections/SectorFlowsSection.tsx` + `.test.tsx`
  - `components/agent/sections/RecommendationsSection.tsx` + `.test.tsx`
  - `components/agent/sections/ScenariosSection.tsx` + `.test.tsx`
  - `services/briefing/scenarios.ts` + `.test.ts`
- **수용 기준**:
  - [ ] 5개 이상 섹터 상대강도가 한 차트 또는 표에 표시되고 보유하지 않은 섹터도 포함된다
  - [ ] 유입 상위·유출 섹터 해석 문단이 있다
  - [ ] 미보유 유입 섹터마다 추천 티커 1개 이상과 근거 문장이 있다
  - [ ] 추천 문구에 "검토"·"고려" 톤이 사용되고 확정 매수 지시 문구가 없다
  - [ ] 안 0·1·2·3 네 가지가 모두 표시된다
  - [ ] 각 안에 Before/After 예상 수익률과 "참고용·보장 아님" 표기가 있다
  - [ ] 각 안에 보유 종목 단위 비중 Before/After 표가 있다
  - [ ] 안 0·1·2·3 모두 After 비중(종목+현금) 합계가 100%(±0.1%p)로 검증된다 (`scenarios.ts` 단위 테스트)
  - [ ] KR 종목 매수 단계의 재원 통화는 KRW로 강제되고, US/JP 매수는 해당 통화 우선·부족분만 환전으로 조달된다 (`scenarios.ts` 단위 테스트)
- **검증**: `bun run test -- SectorFlows Recommendations Scenarios scenarios`

---

### Task 9: 상세 — Playbook·환전 시점·수익률 FX 분리

- **담당 시나리오**: Scenario 8 (full), Scenario 9 (full), Scenario 10 (full)
- **크기**: M (5 파일)
- **의존성**: Task 8
- **참조**:
  - wireframe — playbook 플로우, 환율 차트
- **구현 대상**:
  - `components/agent/sections/PlaybookSection.tsx` + `.test.tsx`
  - `components/agent/sections/FxSection.tsx` + `.test.tsx`
  - `components/agent/sections/ReturnBreakdownSection.tsx` + `.test.tsx`
  - `services/briefing/playbook.ts` + `.test.ts`
- **수용 기준**:
  - [ ] playbook이 순서 있는 목록 또는 플로우로 표시된다
  - [ ] USD 부족 시 환전 단계가 첫 단계(0단계)로 표시된다
  - [ ] 각 단계에 %p 변화와 사용 통화가 표시된다
  - [ ] 환전만 수행하고 매수를 보류하는 playbook 구성(예: 안 3)이 다른 안과 시각적으로 구분되어 표시된다
  - [ ] USD/KRW 환율 추세 차트가 1개 이상 표시된다
  - [ ] 환전 권장 시점·금액(KRW 및 환산 USD)·근거 문단(2문장 이상)이 표시된다
  - [ ] KRW 기준 예상 수익률 옆 또는 아래에 환율 영향 항목이 자산 수익과 구분되어 보인다
- **검증**: `bun run test -- Playbook Fx ReturnBreakdown playbook`

---

### Checkpoint: Tasks 4–9 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 보유 등록 → 브리핑 생성 → 요약 → 상세(시나리오·playbook) end-to-end

---

### Task 10: 상세 — 스마트 머니·기관 vs 개인

- **담당 시나리오**: Scenario 11 (full)
- **크기**: S (3 파일)
- **의존성**: Task 7
- **참조**:
  - `services/smart-money/adapter.ts` — fixture
- **구현 대상**:
  - `services/smart-money/adapter.ts` + `.test.ts`
  - `components/agent/sections/SmartMoneySection.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 외국인 또는 기관 수급 데이터가 차트 또는 표로 표시된다
  - [ ] "기관 vs 개인" 제목 또는 상응 문단이 3문장 이상 있다
- **검증**: `bun run test -- smart-money SmartMoneySection`

---

### Task 11: 상세 — 맥락(뉴스·공시·정책)

- **담당 시나리오**: Scenario 12 (full)
- **크기**: S (3 파일)
- **의존성**: Task 7
- **참조**:
  - `services/context/adapter.ts`
  - `services/ai/gemini.ts` — 영향 해석 (optional enhance)
- **구현 대상**:
  - `services/context/adapter.ts` + `.test.ts`
  - `components/agent/sections/ContextSection.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 맥락 항목이 1건 이상 목록으로 표시된다
  - [ ] 각 항목 또는 섹션에 "제안에 미치는 영향" 해석이 1문장 이상 있다
- **검증**: `bun run test -- context ContextSection`

---

### Task 12: 상세 — 애널 리포트·데이터 없음

- **담당 시나리오**: Scenario 13 (full), Scenario 14 (full)
- **크기**: M (4 파일)
- **의존성**: Task 7
- **참조**:
  - spec 불변 규칙 — 증권사명·날짜 없으면 인용 생략
- **구현 대상**:
  - `services/analyst/adapter.ts` + `.test.ts`
  - `components/agent/sections/AnalystSection.tsx` + `.test.tsx`
  - `data/analyst-seed.json` (fixture)
- **수용 기준**:
  - [ ] 애널 표에 증권사명과 날짜가 표시된다
  - [ ] 투자의견(Buy/Hold/Sell 등) 또는 상응 라벨이 표시된다
  - [ ] 상세에 제안과의 정합성 설명이 2문장 이상 있다
  - [ ] 공개 원문 URL이 있을 때 링크가 표시된다
  - [ ] 애널 없는 종목에 "데이터 없음"이 명시되고 수급·가격·뉴스 중 1가지 이상 다른 근거 문장이 있다
  - [ ] 증권사명 또는 날짜가 없는 애널 항목은 렌더에서 생략되고 "출처 미상"으로 표시되지 않는다
- **검증**: `bun run test -- analyst AnalystSection`

---

### Task 13: 상세 — 이벤트 타임라인

- **담당 시나리오**: Scenario 16 (full)
- **크기**: S (3 파일)
- **의존성**: Task 7
- **참조**:
  - `services/events/adapter.ts`
  - wireframe — 이벤트 타임라인
- **구현 대상**:
  - `services/events/adapter.ts` + `.test.ts`
  - `components/agent/sections/EventsSection.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 이벤트 타임라인 UI가 표시된다
  - [ ] 당일 또는 전 시점에 "검토 방향" bullet이 1개 이상 있다
  - [ ] 각 bullet에 근거 문장이 붙어 있다
- **검증**: `bun run test -- events EventsSection`

---

### Task 14: 상세 — 전일 대비 diff

- **담당 시나리오**: Scenario 19 (full)
- **크기**: S (3 파일)
- **의존성**: Task 5 (2일치 브리핑 KV), Task 7
- **구현 대상**:
  - `services/briefing/diff.ts` + `.test.ts`
  - `components/agent/sections/DiffSection.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 전일 대비 변경 항목이 표로 1건 이상 표시된다
  - [ ] 증가·감소 또는 채택·보류가 시각적으로 구분된다
  - [ ] 변경 이유 문단이 2문장 이상 있다
- **검증**: `bun run test -- diff DiffSection`

---

### Task 15: 상세 레포트 — 9섹션 완성도 (Scenario 2 나머지)

- **담당 시나리오**: Scenario 2 (full — 8개 이상 섹션·캡션)
- **크기**: S (2 파일)
- **의존성**: Task 7–14
- **구현 대상**:
  - `components/agent/sections/InstitutionalLensSection.tsx` + `.test.tsx`
  - `components/agent/ChartWithCaption.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 상세 레포트에 9개 주제 중 8개 이상 구분된 섹션이 있다
  - [ ] 각 섹션에 차트 또는 표가 1개 이상 있다
  - [ ] 각 차트·표에 제목과 한 줄 결론 caption이 있다
  - [ ] 상세 레포트의 각 섹션 차트·표마다 2문장 이상 해석 문단이 렌더된다 (Report page 통합 테스트로 전 섹션 검증)
  - [ ] `InstitutionalLensSection`은 SmartMoney의 수급 차트와 별도로 "기관 제약·개인 이점" 요약 전용 섹션이다 (중복 아님)
- **검증**: `bun run test -- InstitutionalLens ChartWithCaption` · Report page 통합 테스트

---

### Task 16: 브리핑 히스토리

- **담당 시나리오**: Scenario 20 (full)
- **크기**: S (3 파일)
- **의존성**: Task 5
- **참조**:
  - wireframe 화면⑥ (`screen-5`)
- **구현 대상**:
  - `app/agent/history/page.tsx`
  - `components/agent/BriefingHistoryList.tsx` + `.test.tsx`
  - `app/api/agent/briefing/[date]/route.ts` (GET)
- **수용 기준**:
  - [ ] 날짜별 브리핑 목록이 최신순으로 표시된다
  - [ ] 날짜 선택 시 해당 일자 요약·상세가 표시된다
- **검증**: `bun run test -- BriefingHistoryList`

---

### Task 17: 알림 설정 화면

- **담당 시나리오**: Scenario 18 (full)
- **크기**: S (3 파일)
- **의존성**: Task 1
- **참조**:
  - wireframe 화면⑤ (`screen-4`)
- **구현 대상**:
  - `lib/agent/settings-storage.ts` + `.test.ts`
  - `app/agent/settings/page.tsx`
  - `components/agent/NotificationSettingsForm.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 이메일·Slack 각각 활성/비활성 토글이 있다
  - [ ] 아침 발송 시각을 변경할 수 있다
  - [ ] 저장 후 재접속 시 설정이 유지된다
- **검증**: `bun run test -- settings-storage NotificationSettingsForm`

---

### Task 18: 매일 아침 정기 알림 (Cron)

- **담당 시나리오**: Scenario 17 (full)
- **크기**: M (5 파일)
- **의존성**: Task 6, Task 17
- **참조**:
  - next-best-practices — cron Route Handler, `CRON_SECRET`
  - wireframe 화면⑧ (`screen-7`) — 아침 요약 미리보기
- **구현 대상**:
  - `vercel.json` (cron schedule)
  - `app/api/agent/cron/daily/route.ts`
  - `services/notifications/email.ts`, `services/notifications/slack.ts` + tests
  - `services/notifications/format-summary.ts` + `.test.ts`
- **수용 기준**:
  - [ ] Cron 핸들러가 당일 브리핑 요약을 이메일 또는 Slack으로 발송한다 (통합 테스트는 mock)
  - [ ] 요약 본문에 결론 3줄 이상·차트/표 블록 1개 이상·상세 링크가 포함된다
  - [ ] 정기 알림은 요약만 포함하고 전체 상세 본문은 포함하지 않는다
  - [ ] 이메일·Slack 요약 본문에 면책 문구 1줄 이상이 포함된다
- **검증**: `bun run test -- notifications/format-summary` · Route Handler unit test with mocked Resend/Slack

---

### Task 19: 이벤트 즉시 알림

- **담당 시나리오**: Scenario 15 (full)
- **크기**: M (4 파일)
- **의존성**: Task 18, Task 13
- **참조**:
  - next-best-practices — `after()` 비동기 발송
- **구현 대상**:
  - `app/api/agent/notify/event/route.ts`
  - `services/notifications/format-event.ts` + `.test.ts`
  - `services/briefing/regenerate-on-event.ts` + `.test.ts`
- **수용 기준**:
  - [ ] 이벤트 반영 후 브리핑 갱신 직후 알림 발송 로직이 호출된다 (mock 검증)
  - [ ] 알림 본문에 방향 변경 요약(3줄 이내)·근거 1문장 이상·상세 URL이 포함된다
  - [ ] 이벤트 알림은 정기 아침 알림과 별도 채널/함수로 발송된다
  - [ ] 이벤트 알림 본문에 면책 문구 1줄 이상이 포함된다
- **검증**: `bun run test -- format-event regenerate-on-event`

---

### Task 20: 에이전트 대화 (Gemini)

- **담당 시나리오**: Scenario 21 (full)
- **크기**: M (4–5 파일)
- **의존성**: Task 6, `GEMINI_API_KEY`
- **참조**:
  - wireframe 화면⑦ (`screen-6`)
  - `services/ai/gemini.ts`
- **구현 대상**:
  - `services/ai/gemini.ts` + `.test.ts` (mock)
  - `app/api/agent/chat/route.ts`
  - `app/agent/chat/page.tsx`
  - `components/agent/AgentChat.tsx` + `.test.tsx`
- **수용 기준**:
  - [ ] 채팅 입력창과 전송 UI가 있다
  - [ ] 질문 후 에이전트 답변이 화면에 표시된다
  - [ ] 답변에 당일 브리핑의 안 번호·섹터·티커 중 1개 이상이 언급된다
  - [ ] 답변과 UI에 면책·검토 톤이 유지된다
- **검증**: `bun run test -- AgentChat gemini` (Gemini mock)

---

### Checkpoint: Tasks 16–20 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] `e2e/agent.spec.ts` — 보유 등록 → 요약 → 상세 링크 → 설정 저장 스모크
- [ ] Human review — wireframe 9화면 대비 `/agent` UI (증거: `artifacts/portfolio-agent/evidence/ui-review.md`)

---

## 시나리오 커버리지 매트릭스

| Scenario | Task(s) |
|---|---|
| 1 요약 페이지 | 6 |
| 2 상세·초보자 설명 | 7, 15 |
| 3 보유 등록 | 2, 4 |
| 4 섹터 태그 | 3 |
| 5 전 섹터 흐름 | 8 |
| 6 미보유 추천 | 8 |
| 7 시나리오 Before/After | 8 |
| 8 Playbook | 9 |
| 9 환전 시점 | 9 |
| 10 수익률 FX 분리 | 9 |
| 11 스마트 머니 | 10 |
| 12 맥락 | 11 |
| 13 애널 인용 | 12 |
| 14 애널 없음 | 12 |
| 15 이벤트 즉시 알림 | 19 |
| 16 이벤트 타임라인 | 13 |
| 17 아침 정기 알림 | 18 |
| 18 알림 설정 | 17 |
| 19 전일 diff | 14 |
| 20 히스토리 | 16 |
| 21 채팅 | 20 |
| 22 보유 없음 | 1 |
| 23 브리핑 실패 | 5 |

## 미결정 항목

| 항목 | plan 초안 결정 | 후속 조치 |
|---|---|---|
| 한국 외국인·기관 수급 소스 | MVP fixture + `SmartMoneyAdapter` 인터페이스 | KRX/FSS 공개 API 확정 후 Task 10 어댑터 교체 |
| 애널 공개 요약 소스 | `data/analyst-seed.json` + 어댑터 | Naver 리서치·FnGuide 등 합법 수집 경로 확정 후 Task 12 연동 |
| 환전 수수료·스프레드 | `config/agent.ts` 기본 0.3% | 사용자 설정 필드는 Task 17 확장 |
| 예상 수익률 기간 가중 | 7d 40% / 1mo 35% / 분기 25% | 백테스트 검증 후 `config/agent.ts` 조정 |
| standalone `portfolio-agent` repo | 문서·wireframe 미러만 유지 | 구현은 `my-quant` `/agent`에서 진행 |

## 구현 순서 요약

```
Task 1 → 2 → 3 → [CP1] → 4 → 5 → 6 → 7 → 8 → 9 → [CP2]
→ 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → [CP3]
```

고위험 조기 배치: **Task 5**(브리핑·KV·실패 UX), **Task 4**(시세/FX), **Task 8**(시나리오 100% 합계·통화 규칙 불변).

**사이징 주의**: Task 8·9는 각 3시나리오·6~8 AC로 M 상한에 근접. 구현 시 `scenarios.ts`/`playbook.ts` 단위 테스트를 먼저 작성해 로직을 UI와 분리한다.
