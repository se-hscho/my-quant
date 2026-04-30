# Yahoo Finance API: 항상 adjclose 사용

Yahoo Finance `chart` 엔드포인트는 두 가지 시계열을 반환한다:

- `result.indicators.quote[0].close` — **원시 종가** (split·dividend 미반영)
- `result.indicators.adjclose[0].adjclose` — **수정 종가** (split·dividend 반영)

## 함정

원시 close를 쓰면 stock split이 단일일 -90%(예: NVDA 2024 10:1) 또는 -75%(AAPL 2020 4:1) 수익률로 들어가 다음을 모두 왜곡한다:

- 평균 수익률, 공분산
- Sharpe, MDD
- 백테스트 누적 수익률 곡선
- 효율적 프론티어 모양

배당주(JNJ, KO, PG 등)는 총수익이 systematically 과소계상된다.

## 규칙

```ts
const series =
  result.indicators.adjclose?.[0]?.adjclose ?? result.indicators.quote[0]?.close ?? [];
```

- 우선 `adjclose`를 사용하고, 없을 때만 raw close로 fallback한다.
- 기존 raw-close 캐시가 있다면 cache key prefix를 bump해서 invalidate한다 (예: `quant:cache:` → `quant:cache:v2:`).
