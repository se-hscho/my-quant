# React 19 + Vitest: act 환경 설정

React 19에서 `renderHook` 또는 비동기 클라이언트 훅을 테스트하면 다음 두 함정에 빠진다.

## 증상
- `Warning: The current testing environment is not configured to support act(...)`
- 비동기 본체가 끝나기 전에 assertion이 실행돼 `result.current`가 오래된 값을 가리킴

## 규칙

1. **`vitest.setup.ts`에 한 번만 추가한다**:
   ```ts
   globalThis.IS_REACT_ACT_ENVIRONMENT = true;
   ```

2. **모든 비동기 hook 호출은 `await act(async () => …)`로 감싼다**:
   ```ts
   await act(async () => {
     await result.current.run();
   });
   expect(result.current.status).toBe("done");
   ```
   - 동기 `act(() => …)`는 비동기 본체를 대기하지 않는다.
   - `act`를 누락하면 React가 state 업데이트를 flush하지 않는다.

이 두 가지를 함께 적용해야 한다 — 하나만으로는 부족하다.
