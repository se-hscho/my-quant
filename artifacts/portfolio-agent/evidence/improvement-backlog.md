# Improvement Backlog — portfolio-agent

**Iteration:** 4  
**Last verify:** 2026-07-04  
**Last product verdict:** ITERATE → SHIP candidate  
**Verification:** [verification-latest.md](./verification-latest.md)  
**Product review:** [product-review-latest.md](./product-review-latest.md)

## Open (this iteration)

### P0 — Blocker
_(none)_

### P1 — Major
_(none)_

### P2 — Minor
- [ ] S15/S17 알림 실발송 — staging에서 Resend/Slack env 수동 검증

## Done

- [x] **Loop 3** 데모 포트폴리오 미리보기 + Yahoo `.KS` + KV memory + 오류 code/detail UI
- [x] **Loop 3** fixture 어댑터 단위 테스트 + generate.fixture-sections
- [x] **Loop 4** spec §22·§23 수용 기준 갱신 (데모 미리보기·오류 detail)
- [x] **Loop 4** `/agent/report/today` 별칭
- [x] **Loop 4** PortfolioCashRow 0원 통화 생략
- [x] **Loop 4** AgentChatDock 모바일 배지 설명 + Q&A 카피 수정

## Deferred (Phase 2)

- KRX 스마트 머니 실데이터 어댑터
- 애널 리포트 외부 API 연동
- 알림 채널 프로덕션 E2E

## Loop log

| # | Date | Verdict | Top fix | Notes |
|---|------|---------|---------|-------|
| 1 | 2026-07-03 | ITERATE | UX 카피·검증 루프 | pass 3 / partial 4 / missing 16 |
| 2 | 2026-07-03 | SHIP* | Tasks 5–20 MVP | *조기 종료 |
| 3 | 2026-07-03 | ITERATE | 데모 미리보기·오류 표시 | pass 21 / partial 3 |
| 4 | 2026-07-04 | SHIP candidate | spec·polish·fixture tests | pass 22 / partial 2 (S15,S17) |

## How to run next loop

```bash
bun run verify:feature -- portfolio-agent
```
