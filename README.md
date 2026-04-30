# 퀀트 포트폴리오 최적화

큐레이션된 주식 번들에서 최적 포트폴리오 가중치를 계산하는 웹 앱.
효율적 프론티어 시뮬레이션, 백테스팅, 결과 저장·비교까지 지원합니다.

## 주요 기능

- **번들 선택**: 테마형·팩터형·전통 배분 등 큐레이션 번들 + 직접 번들 추가
- **최적화**: Max Sharpe / Min Variance / Risk Parity 3가지 전략
- **효율적 프론티어**: 10,000개 시뮬레이션 포인트 + 최적 가중치 강조
- **백테스팅**: 최적 포트폴리오 vs Buy & Hold 누적 수익률 비교, 요약 메트릭
- **결과 저장·비교**: 로컬 저장 후 두 결과를 나란히 비교
- **사용자 번들**: 직접 종목을 구성해 번들로 저장·삭제

## 기술 스택

| 범주 | 라이브러리 |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| 차트 | Recharts (ResponsiveContainer 필수) |
| 데이터 | Yahoo Finance API (adjclose 기반) |
| 상태 | localStorage (결과·사용자 번들) |
| 테스트 | Vitest + Testing Library, Playwright |
| 패키지 | Bun |

## 시작하기

```bash
bun install
bun dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

E2E 테스트 최초 실행 전 Chromium 설치:

```bash
bunx playwright install chromium
```

## 스크립트

| 명령어 | 설명 |
|---|---|
| `bun dev` | 개발 서버 실행 |
| `bun run build` | 프로덕션 빌드 |
| `bun run test` | Vitest 실행 |
| `bun run test:watch` | Vitest 워치 모드 |
| `bun run test:e2e` | Playwright E2E 실행 |
| `bun run lint` | ESLint 실행 |

## 아키텍처

```
types/ → config/ → lib/ → services/ → hooks/ → components/ → app/
```

역방향 의존 금지. `lib/`에 Yahoo Finance API 클라이언트·최적화 계산·localStorage 유틸이 위치합니다.

### 주요 파일

| 경로 | 역할 |
|---|---|
| `app/api/prices/route.ts` | Yahoo Finance 프록시 (adjclose, 10s 타임아웃) |
| `lib/optimization.ts` | 포트폴리오 최적화 (Sharpe·분산·리스크패리티) |
| `lib/custom-bundles.ts` | 사용자 번들 CRUD (localStorage) |
| `lib/storage.ts` | 결과 저장·불러오기 (localStorage) |
| `hooks/useOptimization.ts` | 최적화 실행 상태 머신 |
| `components/gallery/` | 번들 갤러리·카드 |
| `components/results/` | 효율적 프론티어·파이차트·백테스팅 |

## 개발 워크플로우

Spec-Driven Development: `/write-spec` → `/draft-plan` → `/execute-plan` → `/compound`

`artifacts/<feature>/spec.md`가 각 feature의 단일 불변 계약입니다.

## Hooks

Claude Code hooks 기반 자동 품질 게이트 (`.claude/settings.json`)

| 단계 | 트리거 | 동작 |
|---|---|---|
| WorktreeCreate | 워크트리 생성 | `worktree-create.sh` — main 동기화, `.env` 복사, 의존성 설치 |
| PostToolUse | `Write\|Edit` | `lint-fix.sh` — ESLint auto-fix |
