# Product Review — portfolio-agent

**Date:** 2026-07-04  
**Verdict:** SHIP  
**Loop:** 7

## Executive Summary

Loop 7에서 **알림 파이프라인(S15/S17)** format·dispatch·route 단위 테스트를 추가해 spec-matrix **partial 0 / pass 23**에 도달했다. E2E는 **브리핑 Q&A quick prompt**, **등록 후 상세 레포트 진입**, **히스토리 빈 상태 CTA**를 검증한다. `BriefingErrorState` 기술 상세는 **고급 정보 접기**로 일반 사용자 신뢰를 유지한다. MVP 범위 내 시나리오는 자동 검증으로 커버되며, staging 실발송 smoke만 post-ship P2로 남긴다.

## Scenario Scorecard (Loop 7 변경)

| Scenario | Loop 6 | Loop 7 | Evidence |
|----------|--------|--------|----------|
| S15 이벤트 즉시 알림 | partial | **pass** | `format-event.test.ts`, `route.test.ts`, `dispatch.ts` |
| S17 아침 정기 알림 | partial | **pass** | `format-summary.test.ts`, `cron/daily/route.test.ts` |
| S21 Q&A E2E | unit only | **e2e covered** | `agent-usability.spec.ts`, `agent-natural-language.spec.ts` |
| S20 히스토리 | pass | **e2e CTA** | history empty → `/agent` |
| §23 오류 UI | pass | **고급 정보 접기** | `BriefingErrorState.tsx` |

**Matrix:** pass 23 · partial 0 · missing 0

## Findings

### P0 — Blocker
없음.

### P1 — Major
없음.

### P2 — Minor
- Staging Resend/Slack **실발송** 1회 smoke (env `NOTIFICATION_EMAIL_TO`, `RESEND_API_KEY`, `SLACK_WEBHOOK_URL`)
- 사용자별 `NotificationSettingsForm` → 서버 dispatch 연동 (현재 env 기반)

### Deferred (Phase 2)
- KRX 실수급·애널 유료 API
- CSV·증권사 연동

## What's Working
- **23/23 시나리오** spec-matrix pass (fixture/MVP 경계 명시)
- **알림:** format → dispatch → after() 경로 단위·route 테스트
- **E2E:** 데모→등록→상세→Q&A→히스토리 CTA 전체 여정
- **신뢰:** fixture 용어 제거, 오류 code/detail 접기

## Regression vs Loop 6

| 항목 | Loop 6 | Loop 7 |
|------|--------|--------|
| Matrix partial | 2 (S15,S17) | **0** |
| E2E Q&A | 없음 | quick prompt + API |
| 상세 레포트 E2E | P2 | **done** |
| 알림 테스트 | 없음 | 7 tests |

## Verdict rationale

MVP spec 23 시나리오가 구현·자동 검증(192 unit + e2e)으로 커버된다. 실 KRX·실발송 staging smoke는 Phase 2/운영 checklist로 분리해도 **제품 가치 차단이 아니다**.
