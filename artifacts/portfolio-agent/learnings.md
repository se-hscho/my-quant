# Learnings — portfolio-agent

## Loop 9 (2026-07-04)

### 알림 Cron ↔ KST 설정
- Vercel cron은 UTC 기준이므로 **30분 간격(`0,30 * * * *`) + KST 시·분 매칭**으로 `morningTimeKst`를 반영한다.
- 하루 1회 idempotency(`morning-sent`) 없으면 30분 cron이 중복 발송할 수 있다.

### 테스트 알림
- Staging smoke는 **`POST /api/agent/notifications/test`** + 설정 화면 버튼으로 사용자가 직접 검증 가능.
- `force=1` 쿼리로 cron 핸들러 수동 트리거 가능 (`CRON_SECRET` 필요).

### Product review 함정
- `isReadOnlyChatMessage`가 briefing Q&A를 가로채면 spec §21이 unit test만 pass하고 UX는 fail — orchestrator 순서가 중요.
- 사용자-facing copy에 `fixture` 개발 용어가 남으면 신뢰도 급락.

### E2E
- 히스토리 빈 상태는 서버 briefing index에 따라 DOM이 바뀜 — **API route mock**으로 empty dates 고정.

## Shipped (2026-07-04)

- PR #14 → `main` merge (`0a552e4`)
- `main`에서 `verify:feature -- portfolio-agent` PASS

## Deferred (의도적 제외)

- KRX 실수급·애널 유료 API — 어댑터 인터페이스만 유지, fixture 기본
- 다중 사용자 인증 — single-user MVP
