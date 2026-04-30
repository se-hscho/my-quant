# url-to-markdown 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 변환 실행 경계 | `app/api/convert/route.ts` Route Handler + 클라이언트 페이지 호출 | URL fetch와 `defuddle` 실행을 서버 경계 안에 두면 브라우저 CORS 제약을 피하고, 클라이언트는 상태 관리와 렌더링에 집중할 수 있다. |
| 결과의 단일 소스 | 응답 payload에 raw Markdown + 메타데이터(title, author) 저장, UI는 raw를 기준으로 미리보기/복사/다운로드/LLM 이동 처리 | 내보내기 동작들이 모두 같은 원본 문자열을 공유해야 복사·다운로드·LLM handoff 결과가 일치한다. |
| 미리보기 렌더링 | raw Markdown을 UI에서 렌더링 가능한 preview 컴포넌트로 변환 | spec이 "렌더링된 HTML 형태" 미리보기를 요구하므로, raw 저장과 렌더링 표시를 분리해 검증 가능하게 만든다. |
| 에러 피드백 | 전역 `sonner` Toaster + 사용자 친화 메시지 | wireframe과 spec이 토스트 기반 에러/성공 피드백을 요구하고, 프로젝트의 `shadcn` 규약도 toast를 `sonner`로 통일한다. |
| 프롬프트/외부 열기 | 프롬프트 조합과 ChatGPT/Claude URL 생성은 클라이언트 유틸로 분리 | 프롬프트 선택, custom 입력, 새 탭 URL 인코딩은 순수 함수로 분리해야 테스트가 쉽고 브라우저 동작 검증과 분리된다. |
| 상태 일관성 | preview, copy, download, LLM handoff는 동일한 raw Markdown을 사용한다 | 시나리오 4-7이 서로 다른 결과를 내면 회귀를 찾기 어려우므로 cross-task invariant로 고정한다. |
| 입력/프롬프트 수명 | 실패 시 현재 입력값은 유지하고, custom prompt는 메모리 상태에만 두어 새로고침 시 초기화한다 | Scenario 3과 8의 기대 동작이 서로 다른 상태 수명을 요구하므로 plan 단계에서 명시해야 한다. |
| 결과 헤더 범위 | MVP 헤더는 `title` 필수, `author`/`publishedAt` 선택으로 다루되 수용 기준은 `title`과 `author`만 강제한다 | wireframe의 날짜는 예시 데이터로 해석하고, spec에 없는 값을 필수 요구사항으로 승격하지 않기 위해 범위를 고정한다. |

## 인프라 리소스

애플리케이션 코드 바깥에서 이 feature가 필요로 하는 런타임 자원. 해당 없으면 "None"으로 비워 둔다.

None

## 데이터 모델

### ConversionResult
- `sourceUrl` (required)
- `title` (required)
- `author` (optional)
- `publishedAt` (optional)
- `markdown` (required)

### PromptSelection
- `mode` (required: `summary` | `translate-ko` | `explain-simple` | `custom` | `none`)
- `customPrompt` (optional; 새로고침 시 유지하지 않음)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| `next-best-practices` | Task 1, 2, 3, 5 | App Router 구조, client/server 경계, route handler 배치 |
| `vercel-react-best-practices` | Task 2, 5 | 비동기 요청 흐름과 상태 업데이트를 단순하게 유지 |
| `shadcn` | Task 1, 3, 4, 5 | `Field`, `Button`, `Select`, `Switch`, `Textarea`, `sonner` 규약 준수 |
| `sketch-wireframe` | Task 1, 4, 5 | 모바일 우선 배치, 프롬프트 칩 위치, 결과 상태 UI 정렬 |
| `execute-plan` | 전체 | plan 실행 시 Task 순서, TDD, checkpoint 운영 규칙 정렬 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `app/page.tsx` | Modify | Task 1 |
| `app/layout.tsx` | Modify | Task 3 |
| `app/globals.css` | Modify | Task 2, 5 |
| `app/api/convert/route.ts` | New | Task 2, 3 |
| `components/url-to-markdown/url-to-markdown-page.tsx` | New | Task 1, 2, 3, 4, 5 |
| `components/url-to-markdown/url-input-form.tsx` | New | Task 1 |
| `components/url-to-markdown/result-preview.tsx` | New | Task 2 |
| `components/url-to-markdown/export-menu.tsx` | New | Task 4, 5 |
| `components/url-to-markdown/prompt-selector.tsx` | New | Task 5 |
| `components/url-to-markdown/theme-toggle.tsx` | New | Task 1, 6 |
| `lib/url-to-markdown/convert-url.ts` | New | Task 2 |
| `lib/url-to-markdown/export.ts` | New | Task 4 |
| `lib/url-to-markdown/llm-handoff.ts` | New | Task 5 |
| `components/url-to-markdown/url-input-form.test.tsx` | New | Task 1 |
| `components/url-to-markdown/url-to-markdown-page.test.tsx` | New | Task 2, 3, 5, 6 |
| `lib/url-to-markdown/convert-url.test.ts` | New | Task 2 |
| `lib/url-to-markdown/export.test.ts` | New | Task 4 |
| `lib/url-to-markdown/llm-handoff.test.ts` | New | Task 5 |
| `e2e/url-to-markdown.spec.ts` | New | Task 2, 4, 5, 6 |
| `package.json` | Modify | Task 2, 3 |

## Tasks

### Task 1: URL 입력 쉘과 리셋 플로우 만들기

- **담당 시나리오**: Scenario 1 (initial UI only), Scenario 2 (full)
- **크기**: M (3-5 파일)
- **의존성**: None
- **참조**:
  - `shadcn` - forms, switch, semantic styling
  - `sketch-wireframe` - mobile-first layout, initial screen structure
  - `next-best-practices` - App Router page boundary
  - `artifacts/url-to-markdown/spec.md`
  - `artifacts/url-to-markdown/wireframe.html`
- **구현 대상**:
  - `app/page.tsx`
  - `components/url-to-markdown/url-to-markdown-page.tsx`
  - `components/url-to-markdown/url-input-form.tsx`
  - `components/url-to-markdown/theme-toggle.tsx`
  - `components/url-to-markdown/url-input-form.test.tsx`
- **수용 기준**:
- [x] 앱 진입 시 URL 입력 필드가 비어 있고 자동으로 포커스를 받는다.
- [x] 초기 화면에 변환 버튼과 다크모드 토글이 표시된다.
- [x] URL 입력 후 지우기 버튼을 누르면 입력 필드가 빈 상태로 돌아간다.
- [x] 결과가 표시된 이후라도 지우기 버튼을 누르면 결과 영역이 사라지고 초기 상태 레이아웃으로 돌아간다.
- **검증**:
  - `bun run test -- components/url-to-markdown/url-input-form.test.tsx`
  - `bun run build`

---

### Task 2: 변환 요청과 결과 미리보기를 연결하기

- **담당 시나리오**: Scenario 1 (happy path only)
- **크기**: M (3-5 파일)
- **의존성**: Task 1 (입력 쉘이 있어야 변환 흐름을 연결할 수 있다)
- **참조**:
  - `next-best-practices` - route handlers, runtime selection, data patterns
  - `vercel-react-best-practices` - async API routes, loading state
  - `https://defuddle.md/docs`
  - `artifacts/url-to-markdown/spec.md`
  - `examples/requirements.md`
- **구현 대상**:
  - `app/api/convert/route.ts`
  - `lib/url-to-markdown/convert-url.ts`
  - `components/url-to-markdown/result-preview.tsx`
  - `components/url-to-markdown/url-to-markdown-page.tsx`
  - `lib/url-to-markdown/convert-url.test.ts`
- **수용 기준**:
- [x] `https://example.com` 입력 후 변환 버튼 클릭 또는 Enter 입력 시 로딩 상태가 화면에 나타난다.
- [x] 변환 성공 시 결과 영역에 페이지 제목 텍스트가 표시된다.
- [x] 저자 정보가 있는 응답이면 결과 영역 헤더에 저자 정보가 표시된다.
- [x] 변환 성공 시 본문 내용이 렌더링된 HTML 형태의 미리보기로 표시된다.
- **검증**:
  - `bun run test -- lib/url-to-markdown/convert-url.test.ts components/url-to-markdown/url-to-markdown-page.test.tsx`
  - `bun run build`
  - `bun run test:e2e -- e2e/url-to-markdown.spec.ts` (mocked conversion response로 happy path 확인)

---

### Checkpoint: Tasks 1-2 이후
- [x] 모든 테스트 통과: `bun run test`
- [x] 빌드 성공: `bun run build`
- [x] URL 입력 -> 변환 시작 -> 결과 미리보기 표시까지의 기본 vertical slice가 end-to-end로 동작

---

### Task 3: 에러 토스트와 실패 복구 흐름 추가하기

- **담당 시나리오**: Scenario 3 (full)
- **크기**: M (3-5 파일)
- **의존성**: Task 2 (실패해야 할 변환 경계가 먼저 필요하다)
- **참조**:
  - `shadcn` - sonner toast
  - `next-best-practices` - error handling
  - `artifacts/url-to-markdown/spec.md`
- **구현 대상**:
  - `app/layout.tsx`
  - `app/api/convert/route.ts`
  - `components/url-to-markdown/url-to-markdown-page.tsx`
  - `components/url-to-markdown/url-to-markdown-page.test.tsx`
  - `package.json`
- **수용 기준**:
- [x] `not-a-url` 입력 후 변환 시도 시 유효하지 않은 URL임을 알리는 토스트 메시지가 나타난다.
- [x] 잘못된 URL 에러가 발생한 뒤에도 입력 필드에는 기존 URL 문자열이 유지된다.
- [x] 접속 실패 또는 변환 실패 응답이면 실패 원인을 설명하는 토스트 메시지가 나타난다.
- [x] 실패가 끝나면 로딩 인디케이터가 사라져 다시 시도할 수 있다.
- **검증**:
  - `bun run test -- components/url-to-markdown/url-to-markdown-page.test.tsx`
  - `bun run build`

---

### Task 4: 복사와 다운로드 내보내기를 완성하기

- **담당 시나리오**: Scenario 4 (full), Scenario 5 (full)
- **크기**: M (3-5 파일)
- **의존성**: Task 3 (성공/실패 피드백 규약을 재사용한다)
- **참조**:
  - `shadcn` - action composition, success feedback
  - `sketch-wireframe` - result 상태의 export control 배치
  - `artifacts/url-to-markdown/spec.md`
- **구현 대상**:
  - `components/url-to-markdown/export-menu.tsx`
  - `components/url-to-markdown/url-to-markdown-page.tsx`
  - `lib/url-to-markdown/export.ts`
  - `lib/url-to-markdown/export.test.ts`
  - `e2e/url-to-markdown.spec.ts`
- **수용 기준**:
- [x] "복사하기" 실행 후 클립보드에 `#`으로 시작하는 raw Markdown 텍스트가 담긴다.
- [x] 복사 성공 후 토스트 또는 버튼 상태로 성공 피드백이 표시된다.
- [x] ".md 다운로드" 실행 시 `.md` 확장자를 가진 파일 다운로드가 시작된다.
- [x] 다운로드된 파일 내용이 복사 결과와 동일한 raw Markdown이다.
- **검증**:
  - `bun run test -- lib/url-to-markdown/export.test.ts components/url-to-markdown/url-to-markdown-page.test.tsx`
  - `bun run build`
  - `bun run test:e2e -- e2e/url-to-markdown.spec.ts` (clipboard/download assertion 포함)

---

### Checkpoint: Tasks 3-4 이후
- [x] 모든 테스트 통과: `bun run test`
- [x] 빌드 성공: `bun run build`
- [x] 변환 성공 결과에서 에러 피드백, 복사, 다운로드까지의 vertical slice가 end-to-end로 동작

---

### Task 5: 프롬프트 선택과 LLM 이동을 완성하기

- **담당 시나리오**: Scenario 6 (full), Scenario 7 (full), Scenario 8 (full)
- **크기**: M (3-5 파일)
- **의존성**: Task 4 (결과 원본과 export UI가 먼저 준비되어야 한다)
- **참조**:
  - `shadcn` - toggle group, textarea, switch
  - `sketch-wireframe` - prompt chips above input, custom prompt textarea
  - `next-best-practices` - client boundary for browser APIs
  - `vercel-react-best-practices` - keep prompt composition in pure helpers
  - `artifacts/url-to-markdown/spec.md`
  - `artifacts/url-to-markdown/wireframe.html`
- **구현 대상**:
  - `components/url-to-markdown/export-menu.tsx`
  - `components/url-to-markdown/prompt-selector.tsx`
  - `components/url-to-markdown/url-to-markdown-page.tsx`
  - `lib/url-to-markdown/llm-handoff.ts`
  - `lib/url-to-markdown/llm-handoff.test.ts`
- **수용 기준**:
- [x] 결과 상태에서 "요약해줘", "한국어로 번역해줘", "쉽게 설명해줘", "직접 입력" 4가지 옵션 레이블이 표시된다.
- [x] "직접 입력" 선택 시 텍스트 입력 필드가 표시되고, 새로고침하면 직접 입력 내용이 사라진다.
- [x] 프롬프트를 선택하지 않고 "ChatGPT로 열기"를 실행하면 새 탭 URL의 `q` 파라미터에 Markdown 내용이 포함된다.
- [x] 프롬프트를 선택하지 않고 "Claude로 열기"를 실행하면 새 탭 URL의 `q` 파라미터에 Markdown 내용이 포함된다.
- [x] "요약해줘" 프리셋 선택 후 "ChatGPT로 열기"를 실행하면 새 탭 URL의 `q` 파라미터가 `{prompt}\n\n{markdown}` 형식으로 인코딩된다.
- [x] "요약해줘" 프리셋 선택 후 "Claude로 열기"를 실행하면 새 탭 URL의 `q` 파라미터가 `{prompt}\n\n{markdown}` 형식으로 인코딩된다.
- [x] custom prompt 입력 후 "ChatGPT로 열기"를 실행하면 새 탭 URL의 `q` 파라미터 앞부분에 사용자가 입력한 프롬프트가 포함된다.
- [x] custom prompt 입력 후 "Claude로 열기"를 실행하면 새 탭 URL의 `q` 파라미터 앞부분에 사용자가 입력한 프롬프트가 포함된다.
- **검증**:
  - `bun run test -- lib/url-to-markdown/llm-handoff.test.ts components/url-to-markdown/url-to-markdown-page.test.tsx`
  - `bun run build`
  - `bun run test:e2e -- e2e/url-to-markdown.spec.ts` (popup URL, preset/custom prompt 인코딩 확인)

---

### Task 6: 결과 상태 다크모드를 검증 가능하게 마무리하기

- **담당 시나리오**: Scenario 9 (full)
- **크기**: M (3-5 파일)
- **의존성**: Task 5 (결과 상태 UI가 완성되어야 다크모드 결과 화면을 검증할 수 있다)
- **참조**:
  - `shadcn` - semantic dark mode styling
  - `sketch-wireframe` - dark mode result state
  - `next-best-practices` - theme boundary already mounted in layout
  - `artifacts/url-to-markdown/spec.md`
  - `artifacts/url-to-markdown/wireframe.html`
- **구현 대상**:
  - `components/url-to-markdown/theme-toggle.tsx`
  - `components/url-to-markdown/url-to-markdown-page.tsx`
  - `e2e/url-to-markdown.spec.ts`
- **수용 기준**:
- [x] 결과가 표시된 상태에서 다크모드 토글을 누르면 화면 전체가 어두운 테마로 전환된다.
- [x] 다크모드에서 다시 토글을 누르면 라이트 테마로 돌아온다.
- **검증**:
  - `bun run test -- components/url-to-markdown/url-to-markdown-page.test.tsx`
  - `bun run build`
  - `bun run test:e2e -- e2e/url-to-markdown.spec.ts` (result state theme toggle 확인)

---

### Checkpoint: Tasks 5-6 이후
- [x] 모든 테스트 통과: `bun run test`
- [x] 빌드 성공: `bun run build`
- [x] 프롬프트 선택, LLM 새 탭 이동, 결과 상태 다크모드까지의 최종 vertical slice가 end-to-end로 동작

---

## 미결정 항목

없음
