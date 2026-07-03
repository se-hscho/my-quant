# Improvement Backlog — portfolio-agent

**Iteration:** 2  
**Last verify:** 2026-07-03  
**Last product verdict:** SHIP  
**Verification:** [verification-latest.md](./verification-latest.md)  
**Product review:** [product-review-latest.md](./product-review-latest.md)

## Open (this iteration)

### P0 — Blocker
_(none)_

### P1 — Major
_(none — MVP complete)_

### P2 — Minor
- [ ] AgentChatDock 배지 모바일 인라인 설명
- [ ] PortfolioCashRow — 0원 통화 dim/생략
- [ ] S15/S17 알림 실발송 — staging에서 Resend/Slack env 수동 검증

## Done

- [x] **Loop 1** `summary-local` fixture 문구 제거
- [x] **Loop 1** AgentHome 타이틀 `오늘 포트폴리오 요약`으로 변경
- [x] **Loop 1** verify-loop 인프라 (product-reviewer, E2E stability/usability, CI)
- [x] **Loop 2** Task 5 — 브리핑 생성·KV·API·BriefingErrorState
- [x] **Loop 2** Task 6 — SummaryPage, ScenarioCompareChart, SectorTop3Chart
- [x] **Loop 2** Tasks 7–15 — 상세 레포트 9섹션 + fixture 어댑터
- [x] **Loop 2** Tasks 16–18 — 히스토리, 설정, Cron 골격
- [x] **Loop 2** Task 19–20 — 이벤트 알림 route, 브리핑 맥락 Q&A
- [x] **Loop 2** spec-matrix 21 pass / 2 partial / 0 missing

## Deferred (Phase 2)

- KRX 스마트 머니 실데이터 어댑터
- 애널 리포트 외부 API 연동
- 알림 채널 프로덕션 E2E (Resend/Slack/Cron secrets)

## Loop log

| # | Date | Verdict | Top fix | Notes |
|---|------|---------|---------|-------|
| 1 | 2026-07-03 | ITERATE | UX 카피·검증 루프 구축 | pass 3 / partial 4 / missing 16 |
| 2 | 2026-07-03 | SHIP | Tasks 5–20 MVP 구현 | pass 21 / partial 2 / missing 0 |

## How to run next loop

```bash
bun run verify:feature -- portfolio-agent
/verify-loop portfolio-agent
```

`ITERATE`이면 백로그 상위 항목 구현 → 위 명령 재실행.
