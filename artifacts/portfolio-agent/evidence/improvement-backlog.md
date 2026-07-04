# Improvement Backlog — portfolio-agent

**Iteration:** 7  
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
- [ ] Staging에서 Resend/Slack **실발송** smoke (env 수동 1회)

## Done

- [x] **Loop 5** 브리핑 Q&A 라우팅·quick prompt·fixture 카피·히스토리 CTA·chat briefing 폴백
- [x] **Loop 6** product review SHIP
- [x] **Loop 7** 알림 format/dispatch/route 단위 테스트 (S15/S17 pass)
- [x] **Loop 7** E2E: 안 1 Q&A quick prompt·상세 레포트·히스토리 CTA
- [x] **Loop 7** BriefingErrorState 고급 정보 접기
- [x] **Loop 7** API test: 안 1 설명해줘 → Playbook

## Deferred (Phase 2)

- KRX 스마트 머니 실데이터 어댑터
- 애널 리포트 외부 API 연동
- 사용자별 알림 설정 → 서버 dispatch 연동 (현재 env 기반 운영 알림)

## Loop log

| # | Date | Verdict | Top fix | Notes |
|---|------|---------|---------|-------|
| 6 | 2026-07-04 | SHIP | Loop 5 P1 | pass 21 / partial 2 |
| 7 | 2026-07-04 | SHIP | 알림 테스트·E2E 확장 | pass 23 / partial 0 |

## How to run next loop

```bash
bun run verify:feature -- portfolio-agent
```
