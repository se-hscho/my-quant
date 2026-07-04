# Improvement Backlog — portfolio-agent

**Iteration:** 9  
**Last verify:** 2026-07-04  
**Last product verdict:** **COMPLETE**  
**Verification:** [verification-latest.md](./verification-latest.md)  
**Product review:** [product-review-latest.md](./product-review-latest.md)

## Open

_(none — MVP scope complete)_

## Done

- [x] **Loop 9** KST `morningTimeKst` cron matching (`0,30 * * * *`)
- [x] **Loop 9** Morning notification daily idempotency
- [x] **Loop 9** `POST /api/agent/notifications/test` + 설정 UI 버튼
- [x] **Loop 9** E2E settings save smoke (`e2e/agent.spec.ts`)
- [x] **Loop 9** `learnings.md` compound

## Phase 3+ (optional future)

- KRX 스마트 머니 실데이터 어댑터
- 애널 리포트 외부 API
- 다중 사용자·인증
- Preview `--deploy` e2e flake hardening (parallel natural-language)

## Loop log

| # | Date | Verdict | Notes |
|---|------|---------|-------|
| 8 | 2026-07-04 | SHIP | settings→KV→dispatch |
| 9 | 2026-07-04 | **COMPLETE** | cron KST + test notify · 207 tests · pass 23/23 |
