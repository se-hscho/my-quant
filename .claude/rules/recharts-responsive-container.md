# Recharts: ResponsiveContainer 필수

Recharts의 `<ScatterChart>`, `<LineChart>` 등 차트 컴포넌트는 **명시적인 numeric `width`/`height` props** 또는 **`<ResponsiveContainer>` 래퍼**가 없으면 0×0 SVG로 렌더된다.

## 함정

- 부모 div의 Tailwind 클래스(`h-[360px] w-full`)에만 의존하면 차트는 렌더되지 않는다.
- `width={undefined} height={undefined}`로 두는 패턴은 동작하지 않는다.
- JSDOM 단위 테스트는 통과하므로 시각 회귀를 잡지 못한다.

## 규칙

차트는 항상 `<ResponsiveContainer>`로 감싸고, 부모 div에 명시적 높이를 부여한다:

```tsx
<div className="h-[360px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart margin={{ top: 16, right: 16, left: 8, bottom: 24 }}>
      …
    </ScatterChart>
  </ResponsiveContainer>
</div>
```

shadcn `<ChartContainer>`(components/ui/chart.tsx)는 이미 ResponsiveContainer를 내장하므로 우선 사용 후보.
