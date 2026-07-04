# Product Review — portfolio-agent

**Date:** 2026-07-04  
**Verdict:** SHIP  
**Loop:** 6

## Executive Summary

Loop 5 P1 백로그(채팅 Q&A 라우팅·quick prompt·fixture 카피·히스토리 CTA·등록 사용자 chat briefing 폴백)를 모두 반영했다. **“안 1 설명해줘”**는 이제 `answerBriefingQuestion`이 orchestrator 최상단에서 playbook·예상 수익률·disclaimer를 반환하며, 사용자 노출 경로에서 **`fixture` 개발 용어는 제거**되었다. 자동 검증 185 tests + e2e stability/usability PASS. MVP 범위(deferred: S15/S17 실발송·실 KRX 수급)를 제외하면 spec §22 첫 방문 가치 발견·§21 브리핑 Q&A·§20 히스토리·§23 실패 복구가 기획 의도와 정합한다.

## Scenario Scorecard (변경분)

| Scenario | Loop 5 | Loop 6 | Evidence |
|----------|--------|--------|----------|
| S20 히스토리 | partial (dead-end) | **pass** | `BriefingHistoryList.tsx` empty CTA → `/agent` |
| S21 에이전트 대화 | partial (stub 가로챔) | **pass** | `chat-orchestrator.ts` briefing Q&A 우선, `AgentChatDock` quick prompt, `chat-orchestrator.test.ts` |
| S11 스마트 머니 | partial (fixture caption) | **pass (MVP 샘플)** | `SmartMoneySection.tsx` “참고용 샘플 데이터” |
| S19 diff | partial (fixture reason) | **pass** | `diff.ts` 사용자 언어 치환 |
| Trust / fixture 카피 | P1 | **resolved** | `generate.fixture-sections.test.ts` user-facing `/fixture/i` neg |

**Matrix:** pass 21 · partial 2 (S15 알림 즉시, S17 아침 알림 — plan deferred) · missing 0

## Findings

### P0 — Blocker
없음.

### P1 — Major
없음 (Loop 5 항목 전부 해결).

### P2 — Minor (post-MVP polish)
- 등록 후 **상세 레포트 클릭-through** E2E — 회귀 방지용 1케이스 권장
- S4 섹터 태그 — 단위/e2e 없음
- `resolveBriefingForChat` 등록 사용자 경로 — API 통합 테스트 추가 권장
- `BriefingErrorState` code/detail — 일반 사용자용 “고급 정보” 접기 UI

### Deferred (planned)
- S15/S17 실 Resend/Slack·cron 운영 검증
- KRX 실수급·애널 유료 API
- CSV·증권사 연동

## What's Working (keep)
- **데모 가치 발견:** `DemoPreviewBanner` + 전체 요약 + `?demo=1` 상세 — spec §22
- **브리핑 Q&A fidelity:** briefing 맥락 우선 라우팅 + “안 1 설명해줘” quick prompt
- **신뢰 카피:** 샘플 데이터 투명 표현, 개발 용어 제거
- **실패·복구:** `BriefingErrorState` + report GET→POST 재생성
- **규칙 우선 채팅 등록:** LLM 없이 MVP 핵심 루프

## Regression vs Loop 5

| 항목 | Loop 5 | Loop 6 |
|------|--------|--------|
| Verdict | ITERATE | **SHIP** |
| §21 Q&A | stub 우선 (false pass) | playbook 답변 + integration test |
| fixture 카피 | P1 | resolved |
| §20 히스토리 | dead-end | CTA |
| 등록 chat briefing | KV miss → null | snapshot generate 폴백 |

## Next (post-SHIP, optional)
1. S15/S17 실발송 + cron 운영 검증
2. 등록 사용자 상세 레포트 E2E
3. S4 섹터 태그 테스트
