# Improvement Backlog — portfolio-agent

**Iteration:** 1  
**Last verify:** 2026-07-03  
**Last product verdict:** ITERATE  
**Verification:** [verification-latest.md](./verification-latest.md)  
**Product review:** [product-review-latest.md](./product-review-latest.md)

## Open (this iteration)

### P0 — Blocker
_(none)_

### P1 — Major
- [ ] plan Task 6 — `ScenarioCompareChart` (fixture mock) — spec §1 — acceptance: `/agent`에 안 0~3 수익률 비교 UI 1개 이상
- [ ] plan Task 7 — 상세 레포트 골격 + 요약→상세 링크 — spec §1·§2 — acceptance: `/agent/report/today` 2섹션 이상 + 면책
- [ ] plan Task 5 — 브리핑 API + `BriefingErrorState` — spec §23 — acceptance: 503 시 재시도 UI, 불완전 안 미노출
- [ ] plan Task 20 — 브리핑 맥락 Q&A — spec §21 — acceptance: "안 1 설명해줘" → Follow 등 키워드 응답

### P2 — Minor
- [ ] AgentChatDock 배지 모바일 인라인 설명
- [ ] PortfolioCashRow — 0원 통화 dim/생략

## Done

- [x] **Loop 1** `summary-local` fixture 문구 제거 — commit on verify-loop branch
- [x] **Loop 1** AgentHome 타이틀 `오늘 포트폴리오 요약`으로 변경
- [x] **Loop 1** 채팅 도크에 브리핑 Q&A 추후 제공 안내 추가
- [x] **Loop 1** verify-loop 인프라 (product-reviewer, E2E stability/usability, CI)

## Deferred (out of current scope)

- S5–S20 브리핑·알림·히스토리 — plan Task 8–19
- KV·Cron·Resend env 선행 필요

## Loop log

| # | Date | Verdict | Top fix | Notes |
|---|------|---------|---------|-------|
| 1 | 2026-07-03 | ITERATE | UX 카피·검증 루프 구축 | pass 3 / partial 4 / missing 16 |

## How to run next loop

```bash
# 1. P1 항목 구현 후
bun run verify:feature -- portfolio-agent

# 2. 에이전트에게
/verify-loop portfolio-agent
```

`ITERATE`이면 백로그 상위 항목 구현 → 위 명령 재실행 → `product-reviewer`가 회귀 비교.
