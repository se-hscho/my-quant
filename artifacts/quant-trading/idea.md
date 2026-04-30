# 퀀트 포트폴리오 최적화 대시보드

## Problem Statement
HMW — 퀀트 지식이 없는 초보자도 검증된 자산 조합에서 출발해
각 개념의 의미를 이해하며 자신의 리스크 성향에 맞게
포트폴리오 가중치를 최적화할 수 있을까?

## Recommended Direction
사용자가 종목을 입력하는 대신, 큐레이션된 포트폴리오 번들을 제공한다.
번들 → 최적화 방법 선택 → 효율적 프론티어 시각화 → 최적 가중치 출력.
모든 옵션·지표에 초보자용 설명(툴팁/인라인 카드)을 붙여
"이게 뭔지 몰라서 못 쓰는" 진입장벽을 제거한다.

**데이터 레이어**: yfinance로 수집한 히스토리컬 데이터를 로컬 SQLite에 캐싱.
최초 번들 선택 시 fetch → 이후 동일 종목 재요청은 DB에서 서빙.

번들 유형 (예시):
- 테마형: AI·반도체, 헬스케어, 에너지 전환
- 팩터형: Momentum, Low Volatility, Quality, Value
- 전통 배분: 60/40, All-Weather, Permanent Portfolio
- 기관 따라하기: Berkshire Top 10, ARK Innovation

**스택**:
- Python 백엔드: PyPortfolioOpt + yfinance + SQLite (better-sqlite3 or Drizzle ORM)
- 프론트엔드: Next.js + Recharts/D3

## Key Assumptions to Validate
- [ ] 큐레이션 번들이 사용자의 "시작점"으로 충분히 매력적인가
- [ ] 인라인 설명이 있으면 초보자가 최적화 방법을 스스로 선택할 수 있는가
- [ ] yfinance → SQLite 캐싱으로 반복 요청 시 응답 속도 체감 개선
- [ ] 효율적 프론티어 계산 시간 < 5초 (종목 10-20개 기준)

## MVP Scope
- 큐레이션 번들 갤러리 (8-12개 번들, 카드 UI)
- 번들 선택 → 최적화 방법 선택 (Max Sharpe / Min Variance / Risk Parity)
  - 각 방법론에 초보자용 한 줄 설명 + 언제 쓰면 좋은지 가이드
- 효율적 프론티어 시각화 + 최적 가중치 파이차트
  - 차트 위 용어(효율적 프론티어, 샤프비율 등)에 툴팁 설명
- 포트폴리오 백테스팅 vs Buy & Hold 비교
- 핵심 지표 카드: 연환산 수익률, 변동성, 샤프비율, MDD
  - 각 지표 옆 "?" 아이콘 → 초보자용 설명 팝오버
- 종목 카드: 종목명 + 한 줄 설명 (어떤 회사/ETF인지)
- 번들 내 종목 추가/제거 (선택적 커스터마이징)
- **데이터 캐싱**: yfinance fetch → SQLite 저장 → 재요청 시 DB 우선 서빙

## Not Doing (and Why)
- 자유 티커 입력 — 큐레이션 번들이 진입장벽을 낮추는 핵심 가설
- 전문가용 고급 파라미터 노출 — 초보자 UX 우선, 고급 옵션은 접어두기
- 실거래/페이퍼 트레이딩 — MVP 범위 밖
- 국내 주식 — US로 먼저 검증
- 실시간 데이터 — 히스토리컬로 핵심 가정 먼저 검증
- Fama-French 팩터 모델 — MVP 이후
- 외부 클라우드 DB — 로컬 SQLite로 충분, 배포 복잡도 최소화

## Open Questions
- 설명 UX 방식: 툴팁 hover vs 인라인 펼치기 vs 별도 "용어 사전" 페이지?
- 번들 정의: 하드코딩 JSON vs SQLite 테이블 관리?
- 리스크 성향 설문 → 맞춤 번들 추천 기능 MVP에 포함?
- 효율적 프론티어: 몬테카를로 샘플링 vs 해석적 풀이?
- SQLite 데이터 만료 정책: 일봉 데이터 갱신 주기는?
