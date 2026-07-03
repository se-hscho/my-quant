---
name: verify-loop
description: feature의 안정성·사용성 자동 검증을 실행하고 product-reviewer로 기획 의도 대비 비평을 받아 개선 루프를 돌린다. 구현 후 반복 검증, PR 머지 전, "기획대로 됐는지" 확인할 때 트리거. "/verify-loop", "검증 루프", "기획 리뷰", "사용성 테스트 반복"으로도 호출한다.
argument-hint: "feature name (default portfolio-agent)"
---

# Verify Loop — 반복 검증 · 기획 리뷰 · 개선

구현물을 **자동 검증 → 기획 의도 리뷰 → 백로그 → 수정 → 재검증** 사이클로 묶는다.

## Inputs / Outputs

| 입력 | 출력 |
|---|---|
| `artifacts/<feature>/spec.md`, `idea.md`, `plan.md`, `wireframe.html` | `evidence/verification-latest.md` |
| `artifacts/<feature>/evidence/spec-matrix.json` | `evidence/product-review-latest.md` |
| (선택) `PLAYWRIGHT_BASE_URL`, deploy bypass | `evidence/improvement-backlog.md` 갱신 |

## Workflow

### Step 1. 전제 확인

`$ARGUMENTS`에서 feature 이름 추출 (기본 `portfolio-agent`).

- `artifacts/<feature>/spec.md` 존재
- `artifacts/<feature>/evidence/spec-matrix.json` 존재 — 없으면 `references/spec-matrix-template.json` 복사 후 시나리오 채우기

### Step 2. 자동 검증 실행

```bash
bun run verify:feature -- <feature>
```

선택 (Preview 배포 후):

```bash
PLAYWRIGHT_BASE_URL=<url> VERCEL_AUTOMATION_BYPASS_SECRET=<secret> \
  bun run verify:feature -- <feature> --deploy
```

스크립트가 `evidence/verification-latest.md`에 기록:
- `bun run test`, `bun run build`
- `test:e2e:stability`, `test:e2e:usability`, `test:e2e` (또는 deploy subset)
- spec-matrix 요약 (pass/partial/missing 카운트)

**실패 시** 루프를 중단하지 말고 verification에 실패를 기록한 뒤 Step 3으로 진행 (리뷰어가 P0로 올릴 수 있게).

### Step 3. Spec matrix 교차 검증

`spec-matrix.json` 각 항목의 `status`가 evidence와 일치하는지 확인한다.

- 테스트가 없는데 `pass` → `partial` 또는 `missing`으로 수정
- 구현됐는데 `missing` → 갱신

변경 시 matrix 커밋에 포함.

### Step 4. Product Review (`product-reviewer`)

`product-reviewer` sub-agent를 호출한다. 프롬프트에 전달:

- feature 경로
- `verification-latest.md` 전문
- `spec-matrix.json` 요약
- (있으면) 이전 `product-review-latest.md`

리뷰 결과를 `artifacts/<feature>/evidence/product-review-latest.md`에 저장.

### Step 5. Improvement Backlog 갱신

`references/improvement-backlog-template.md` 형식으로 `improvement-backlog.md` 갱신:

- P0/P1 → **Open** 항목 (체크박스)
- 완료된 이전 항목 → **Done** 섹션으로 이동
- `iteration` 번호 증가

### Step 6. 개선 구현 (ITERATE일 때)

Verdict가 `ITERATE`이면:

1. Backlog 상위 1~3개 P0/P1을 선택 (사용자 확인 또는 명시 지시)
2. TDD로 수정 — `execute-plan`과 동일 규율
3. Task당 커밋
4. **Step 2부터 재실행** (루프)

`SHIP`이면 Step 7로.

### Step 7. Compound 훅

`learnings.md`에 이번 루프 기록:

- 반복된 사용성 함정
- spec-matrix와 실제 gap
- product-reviewer가 두 번 연속 지적한 패턴

### Step 8. 보고

사용자에게 제시:

| 항목 | 내용 |
|---|---|
| Verdict | SHIP / ITERATE / HOLD |
| 검증 | test/build/e2e pass/fail 요약 |
| 시나리오 | matrix pass/partial/missing |
| Top 3 gaps | 기획 의도 대비 |
| Next actions | 백로그 링크 |

## 루프 트리거 가이드

| 상황 | 행동 |
|---|---|
| Task/PR 완료 후 | `/verify-loop <feature>` 1회 |
| Preview 배포 후 | `--deploy` 옵션 추가 |
| 사용자 "기획대로?" | product-reviewer만 재실행 가능 |
| P0 수정 후 | 전체 verify-loop 재실행 |

## 관련 에이전트

| 에이전트 | 시점 | 초점 |
|---|---|---|
| plan-reviewer | 구현 **전** | plan ↔ spec |
| code-reviewer | 구현 **후** | 코드 품질 |
| **product-reviewer** | 구현 **후** | 기획 의도 · UX · 시나리오 |

## Commands

| 명령 | 용도 |
|---|---|
| `bun run verify:feature -- portfolio-agent` | 로컬 전체 검증 + evidence |
| `bun run verify:feature -- portfolio-agent --deploy` | Preview E2E 포함 |
| `bun run test:e2e:stability` | 안정성 E2E만 |
| `bun run test:e2e:usability` | 사용성 E2E만 |
