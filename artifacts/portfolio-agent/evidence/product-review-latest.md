# Product Review — portfolio-agent

**Date:** 2026-07-03  
**Verdict:** ITERATE  
**Loop:** 1

## Executive Summary

보유 등록(S3·S4)과 빈 상태 안내(S22), 규칙 우선 채팅(S21 부분)은 안정적이다. 그러나 **스마트 머니 → 시나리오 0~3 → 초보자 해석**이라는 핵심 가치는 화면에 거의 없어 idea.md의 Foundational Thesis가 전달되지 않는다. 가장 큰 gap은 S1 요약에 시나리오 비교·상세 레포트 진입이 없다는 점이다.

## Scenario Scorecard

| Scenario | Status | Notes |
|----------|--------|-------|
| S1 요약 페이지 | partial | 총자산·요약 있음. 시나리오 비교·상세 링크 없음 |
| S2 상세 레포트 | missing | plan Task 6–7 |
| S3 보유 등록 | pass | 폼 + 채팅 |
| S4 섹터 태그 | pass | SectorTagDialog |
| S5 섹터 흐름 | partial | 텍스트만, 차트 없음 |
| S6–S20 | missing | plan Task 5–19 |
| S21 대화 | partial | CRUD OK, 브리핑 Q&A 없음 |
| S22 빈 상태 | pass | EmptyHoldingsState |
| S23 브리핑 실패 | partial | 채팅 LLM 폴백만 |

전체: pass 3 · partial 4 · missing 16 (see `spec-matrix.json`)

## Findings

### P0 — Blocker
없음 (spec-matrix와 실제 구현 일치)

### P1 — Major
1. **S1** 시나리오 0~3 비교 시각 없음 → `ScenarioCompareChart` (plan Task 6)
2. **S1** 상세 레포트 링크 없음 → `/agent/report` 골격 (plan Task 7)
3. **S21** 브리핑 맥락 Q&A 미지원 → scope 안내 추가됨, Task 20 본구현 필요
4. ~~**summary-local** `(fixture)` 노출~~ → **Loop 1에서 수정**
5. ~~**AgentHome** `오늘 요약 (로컬)`~~ → **Loop 1에서 수정**

### P2 — Minor
- 섹터 비중 텍스트만 (차트는 Task 8)
- 모바일에서 AI 배지 설명 접근성
- 현금 0원 통화 표시 정리

### Deferred
- S2, S5–S20 전체 브리핑·알림·히스토리 (plan Task 5–19)

## What's Working (keep)
- 규칙 우선 + LLM 폴백 + rate limit (`chat-orchestrator.ts`)
- EmptyHoldingsState → 자연어 채팅 온보딩
- Valuation + 통화별 현금 분리 (`PortfolioValueCard`)
- SectorTagDialog (S4)

## Next Iteration Backlog
See [improvement-backlog.md](./improvement-backlog.md)

## Regression vs Previous Review
N/A — 첫 리뷰
