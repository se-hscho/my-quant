# Portfolio Agent — Learnings

## Preview URL (Vercel)

구현 완료 보고 시 아래 링크를 함께 제공한다.

| 화면 | URL |
|---|---|
| 에이전트 홈 | https://my-quant-git-cursor-portfolio-agent-t-fc2550-se-hschos-projects.vercel.app/agent |
| 보유 편집 | https://my-quant-git-cursor-portfolio-agent-t-fc2550-se-hschos-projects.vercel.app/agent/holdings |

베이스: `my-quant-git-cursor-portfolio-agent-t-fc2550-se-hschos-projects.vercel.app` (PR Preview, Deployment Protection 가능)

**Vercel env** (Preview 프로젝트): `AGENT_ROOT_REDIRECT=true` → `/` 접속 시 `/agent`로 이동

## UX: 에이전트 vs 채팅

현재 spec은 **브리핑 레포트 우선**(요약 1페이지 → 상세), **채팅은 보조**(Scenario 21, `/agent/chat` — "안 2 설명해줘" 등 Q&A).

"에이전트" = 시장·보유를 **대신 모니터링**하고 아침 브리핑·알림을 **자동 생성**하는 시스템 이름. ChatGPT처럼 빈 채팅창이 홈은 아님.

채팅 **첫 화면**으로 바꾸려면 spec/와이어프레임 변경 필요 — `/idea-refine` 또는 spec 수정으로 논의.

**2026-07-03 결정:** 브리핑 홈은 유지하되, `/agent/*` 모든 화면 **하단 고정 채팅 독** (`AgentChatDock`) — 항상 질의 가능.

**2026-07-03 채팅 명령:** 자연어 → `parseChatCommand` → `actions` → 클라이언트 `applyChatActions` (localStorage). 예: `SOXX 10주 등록`, `KRW 현금 5000만 등록`, `보유 목록`, `도움말`.


plan.md 의존성 순서 그대로: Task 1 → 2 → 3 … (my-quant 기존 Next.js 앱 활용, Task 0 스캐폴드 생략)

## Task 1: `/agent` 보유 없음 안내

- **판단**: `useSyncExternalStore`로 localStorage 보유 여부 구독 — SSR에서는 항상 empty, 클라이언트 hydration 후 갱신.
- **applied**: not-yet

## Task 2: 보유 등록 폼

- **판단**: `HoldingsPageContent`가 draft/saved 분리 — 목록은 저장된 스냅샷만 표시 (spec "저장 후").
- **applied**: not-yet
