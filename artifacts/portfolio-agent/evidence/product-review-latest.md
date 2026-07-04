# Product Review — portfolio-agent

**Date:** 2026-07-04  
**Verdict:** SHIP  
**Loop:** 4

## Executive Summary

이전 Loop 2의 **SHIP 판정은 조기 종료**였다. `product-reviewer` 에이전트를 실제로 돌리지 않고 spec-matrix 자동 pass만으로 문서를 작성했으며, **미보유 사용자는 등록 안내만 보고 브리핑·시나리오·상세 레포트를 전혀 볼 수 없었다**. Loop 3에서 예시 포트폴리오(삼성전자·SOXX·KODEX 200) 실시세 브리핑 미리보기와 KV 미설정 시 메모리 폴백을 추가해 기획 의도(“에이전트가 대신 모니터링”)의 **가치 발견** 경로를 복구했다. 알림 실발송·실데이터 어댑터는 여전히 partial이다.

## Scenario Scorecard

| Scenario | Spec intent | Observed | Status | Evidence |
|----------|-------------|----------|--------|----------|
| 22. 보유 없이 접속 | 등록 안내 + 편집 이동 | 예시 브리핑 전체 + 등록 CTA | **partial** (spec 확장) | `AgentHome.test.tsx`, `e2e/agent-usability.spec.ts` |
| 1. 요약 진입 | 시나리오 비교·결론 | 미보유 시에도 데모로 동일 UI | pass | `demo-preview-banner`, `summary-page` |
| 2. 상세 레포트 | 9섹션 | `?demo=1`로 미보유도 접근 | pass | `ReportPageClient.tsx` |
| 21. 에이전트 대화 | 브리핑 맥락 Q&A | 미보유 시 데모 브리핑으로 Q&A | pass | `chat/route.ts` |
| 23. 브리핑 실패 | 재시도 UI | KV 없을 때 메모리 폴백으로 완화 | partial | `kv.ts` |

pass 21 · partial 3 (S15, S17, S22 확장) · missing 0

## Dimension Notes

### Intent Alignment
- idea.md “대신 모니터링·아침 브리핑”이 **미보유 첫 방문에서도** 데모로 체감 가능해짐 (Loop 2 대비 개선)
- spec §22 원문은 “등록 안내만” — 데모는 **기획 의도에는 부합하나 spec 문서와 불일치** → spec §22 수용 기준 갱신 권장

### Usability
- 첫 방문 → 예시 브리핑 → 상세 → 등록 CTA 흐름이 자연스러움
- “예시 포트폴리오” 라벨로 실보유와 혼동 방지 시도 (면책·배너)

### Stability & Trust
- 이전 SHIP은 **거짓 pass**: 미보유 시 S1·S2·S21이 UI에서 불가능했음
- KV 미설정 Preview에서 503 → 메모리 폴백으로 해결 (인스턴스 간 비영속은 한계)

## Findings

### P0 — Blocker
없음 (Loop 3 수정 후)

### P1 — Major
- **[이전 리뷰 프로세스]** Loop 2 `product-review-latest.md`는 LLM product-reviewer 미실행·수동 작성 — **검증 루프 신뢰도 저하** → `/verify-loop` 시 product-reviewer Task 필수화
- **[spec §22]** 수용 기준 “등록 안내만” vs 구현 “데모 브리핑” — spec.md §22 갱신 또는 acceptance note 추가 필요

### P2 — Minor
- 데모 상세 레포트 URL에 `?demo=1` 필요 — 북마크 시 404 가능 (콜드 스타트)
- 알림·fixture 경계 카피는 여전히 polish 대상

### Deferred (planned)
- S15/S17 실발송, KRX·애널 실데이터

## What's Working (keep)
- 미보유 → `DEMO_PORTFOLIO_SNAPSHOT` + Yahoo 실시세 브리핑 — **기획 가치 발견**에 결정적
- 규칙 우선 채팅 + 데모 브리핑 Q&A — LLM 한도 절약 유지

## Next Iteration Backlog (ordered)
1. [ ] spec.md §22 수용 기준에 “예시 포트폴리오 미리보기” 추가 — acceptance: 미보유 시 `summary-page` + 등록 CTA 동시 표시
2. [ ] verify-loop: product-reviewer를 evidence에 **실행 로그** 남기기
3. [ ] S15/S17 staging env 수동 알림 검증

## Regression vs Previous Review
- Loop 2 SHIP → **ITERATE** (프로세스·미보유 UX gap 인정)
- 미보유 시 S1/S2/S21: **missing(사실상)** → pass (데모 경로)
