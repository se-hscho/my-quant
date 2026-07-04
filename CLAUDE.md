## Workflow Phases

Ideate → Define → Sketch → Plan → Build → **Verify** → Compound

### Spec-Driven Development

| Phase | Skill | 산출물 |
|---|---|---|
| Ideate | `/idea-refine` | `artifacts/<feature>/idea.md` (선택) |
| Specify | `/write-spec` | `artifacts/<feature>/spec.md` |
| Sketch | `/sketch-wireframe` | `artifacts/<feature>/wireframe.html` |
| Plan | `/draft-plan` | `artifacts/<feature>/plan.md` |
| Build | `/execute-plan` | `artifacts/<feature>/learnings.md` |
| **Verify** | **`/verify-loop`** | **`artifacts/<feature>/evidence/`** (검증·기획 리뷰·백로그) |
| Compound | `/compound` | — |

### Verify Loop (반복 개선)

구현 후 **자동 검증 → product-reviewer(기획 의도) → improvement-backlog → 수정 → 재검증**을 반복한다.

| 에이전트 | 시점 | 역할 |
|---|---|---|
| plan-reviewer | 구현 전 | plan ↔ spec |
| code-reviewer | 구현 후 | 코드 품질 |
| **product-reviewer** | 구현 후 | idea·spec·UX 충실도 |

| 명령 | 용도 |
|---|---|
| `bun run verify:feature -- <feature>` | test + build + stability/usability E2E + evidence |
| `bun run verify:feature -- <feature> --deploy` | Preview URL E2E 포함 |

## Development Workflow

- 패키지 매니저: `bun`

### 커밋 규칙
- Conventional 규칙을 따르고, feature 단위로 커밋한다.

## Testing

### 원칙
**수용 기준을 정의한다. 검증될 때까지 반복한다.**

- 모든 변경에는 측정 가능한 수용 기준(구체적인 입력, 관찰 가능한 결과)이 필요하다
- 각 기준은 이를 증명하는 테스트를 가진다. 
- 수용 기준이 실제로 증명되는 가장 낮은 경계를 선택한다. mock이 기준을 가린다면 거기서 mock하지 않는다.

### Stack & 파일 배치

| 도구 | 용도 | 위치 |
|---|---|---|
| Vitest (jsdom, `@testing-library/react`) | 단위·통합·수용 기준 | `<file>.test.tsx` colocated |
| Playwright | E2E | `e2e/*.spec.ts` | global

### Commands

| 명령 | 범위 |
|---|---|
| `bun run test` | Vitest |
| `bun run test:watch` | Vitest watch |
| `bun run test:e2e` | Playwright |
| `bun run test:e2e:stability` | Playwright — API·연속 등록·valuation 안정성 |
| `bun run test:e2e:usability` | Playwright — 빈 상태·대시보드·빠른 입력 UX |
| `bun run verify:feature -- <feature>` | 전체 검증 + `artifacts/<feature>/evidence/` |

## Architecture

순환 의존 방지를 위해 역방향 의존은 금지한다. 의존성이 적은 것부터 구현한다.

| 순서 | 디렉토리 | 허용 의존성 |
|---|---|---|
| 1 | `types/` | 없음 |
| 2 | `config/` | types |
| 3 | `lib/` | types, config |
| 4 | `services/` | types, config, lib |
| 5 | `hooks/` | types, config, lib, services |
| 6 | `components/` | types, config, lib, hooks |
| 7 | `app/` | 모두 |
