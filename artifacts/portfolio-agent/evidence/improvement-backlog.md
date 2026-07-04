# Improvement Backlog — portfolio-agent

**Iteration:** 8  
**Last verify:** 2026-07-04  
**Last product verdict:** SHIP  
**Verification:** [verification-latest.md](./verification-latest.md)  
**Product review:** [product-review-latest.md](./product-review-latest.md)

## Open (this iteration)

### P0 — Blocker
_(none)_

### P1 — Major
_(none)_

### P2 — Minor
- [ ] Staging Resend/Slack **실발송** smoke (설정 화면에서 저장한 주소·Webhook으로 1회)
- [ ] Cron 스케줄 ↔ `morningTimeKst` 동적 매칭 (현재 Vercel cron 고정 + 설정 저장만)

## Done

- [x] **Loop 7** 알림 format/dispatch/route tests, E2E Q&A·상세·히스토리, error UI 접기
- [x] **Loop 8** 알림 설정 → KV + `/api/agent/settings/notifications`
- [x] **Loop 8** `resolveDispatchTargets` — 사용자 활성 채널 우선, env 폴백
- [x] **Loop 8** Cron·이벤트 notify가 저장된 설정으로 dispatch

## Deferred (Phase 2)

- KRX 스마트 머니 실데이터 어댑터
- 애널 리포트 외부 API 연동
- 다중 사용자·인증 기반 설정 분리

## Loop log

| # | Date | Verdict | Top fix | Notes |
|---|------|---------|---------|-------|
| 7 | 2026-07-04 | SHIP | 알림·E2E | pass 23 |
| 8 | 2026-07-04 | SHIP | settings→KV→dispatch | 201 tests |
