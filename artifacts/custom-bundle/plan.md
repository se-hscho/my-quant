# custom-bundle 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 저장소 | `localStorage` (`quant:bundles:v1`) | 기존 results 저장 패턴과 동일, 서버 불필요 |
| 카테고리 타입 | `Bundle.category: string` (기존 union 확장) | 사용자 자유 입력 수용, 기존 번들은 기존 문자열 그대로 유지 |
| 번들 로드 방식 (상세 페이지) | `useEffect` + `useState(undefined)` | ResultView 패턴 재사용, SSR hydration 오류 방지 |
| 카테고리 입력 UI | `Combobox` (기존 카테고리 제안 + 자유 입력) | `components/ui/combobox.tsx` 이미 존재 |
| custom bundle 구분 | `Bundle`에 `isCustom?: boolean` 추가 | 삭제 버튼 노출 여부 제어 |

## 인프라 리소스

None

## 데이터 모델

### CustomBundle (localStorage: `quant:bundles:v1`)
- id: string (crypto.randomUUID)
- name: string (required)
- category: string (기존 카테고리 또는 자유 입력)
- description: string (선택, 기본값 "")
- stocks: Stock[] (ticker만 입력, name/description은 "")
- isCustom: true
- createdAt: string (ISO)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn — forms.md | Task 2 | FieldGroup + Field + InputGroup + Combobox 규칙 |
| shadcn — composition.md | Task 2, 3 | Dialog 조합 패턴 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/index.ts` | Modify | Task 1 |
| `lib/custom-bundles.ts` | New | Task 1 |
| `lib/custom-bundles.test.ts` | New | Task 1 |
| `components/bundle/CreateBundleDialog.tsx` | New | Task 2 |
| `components/bundle/CreateBundleDialog.test.tsx` | New | Task 2 |
| `components/gallery/BundleGallery.tsx` | Modify | Task 3 |
| `components/gallery/BundleCard.tsx` | Modify | Task 3 |
| `components/gallery/BundleCard.test.tsx` | Modify | Task 3 |
| `components/bundle/BundleDetailView.tsx` | Modify | Task 4 |
| `components/bundle/BundleDetailView.test.tsx` | New | Task 4 |

---

## Tasks

### Task 1: custom bundle 저장소 레이어 + 타입

- **담당 시나리오**: S7 (새로고침 후 유지), S6 (최적화 흐름 연결 — 데이터 기반)
- **크기**: S (2 파일 + 테스트)
- **의존성**: None
- **참조**:
  - `lib/storage.ts` — 기존 localStorage 패턴 참조
  - `types/index.ts` — Bundle, Stock 타입
- **구현 대상**:
  - `types/index.ts` — `Bundle`에 `isCustom?: boolean` 추가, `category` 타입을 `string`으로 확장
  - `lib/custom-bundles.ts` — `loadCustomBundles()`, `saveCustomBundle(bundle)`, `deleteCustomBundle(id)`, `getCustomBundleById(id)`
  - `lib/custom-bundles.test.ts`
- **수용 기준**:
  - [x] `saveCustomBundle(bundle)` 호출 후 `loadCustomBundles()`가 해당 번들을 포함한 배열을 반환한다
  - [x] `deleteCustomBundle(id)` 호출 후 `loadCustomBundles()`에서 해당 id가 사라진다
  - [x] `getCustomBundleById(id)`는 저장된 번들을 반환하고, 없으면 `undefined`를 반환한다
  - [x] 저장된 번들은 `isCustom: true`를 가진다
  - [x] `isCustom`이 없는(기본 번들) id를 `deleteCustomBundle`에 전달해도 `loadCustomBundles()`는 변경되지 않는다
- **검증**: `bun run test -- custom-bundles`

---

### Task 2: CreateBundleDialog — 번들 생성 폼

- **담당 시나리오**: S1 (번들 생성 happy path), S2 (카테고리 입력), S3 (종목 추가), S4 (유효성 검사)
- **크기**: M (2 파일)
- **의존성**: Task 1 (`saveCustomBundle`)
- **참조**:
  - shadcn `forms.md` — FieldGroup + Field + InputGroup + Combobox 사용 규칙
  - `components/ui/dialog.tsx`, `combobox.tsx`, `input-group.tsx`, `field.tsx`
  - `config/bundles.ts` — 기존 카테고리 목록 (`BUNDLES` 에서 unique category 추출)
- **구현 대상**:
  - `components/bundle/CreateBundleDialog.tsx`
  - `components/bundle/CreateBundleDialog.test.tsx`
- **수용 기준**:
  - [x] 이름 미입력 상태에서 저장 버튼을 클릭하면 저장되지 않고 "이름을 입력해 주세요" 안내가 표시된다
  - [x] 종목이 1개 이하인 상태에서 저장 버튼을 클릭하면 저장되지 않고 "종목을 2개 이상 추가해 주세요" 안내가 표시된다
  - [x] 이미 추가된 ticker와 동일한 값을 입력하고 추가 버튼을 클릭하면 목록이 변경되지 않고 중복 안내가 표시된다
  - [x] 이름·카테고리·종목 2개를 입력하고 저장하면 `onSave` 콜백이 올바른 번들 데이터와 함께 호출된다
  - [x] 저장 성공 후 Dialog가 닫힌다 (onOpenChange(false) 호출)
  - [x] 카테고리 Combobox에서 기존 카테고리(테마형 등)를 선택하거나 새 문자열을 직접 입력할 수 있다
- **검증**: `bun run test -- CreateBundleDialog`

---

### Checkpoint: Tasks 1-2 이후

- [x] 모든 테스트 통과: `bun run test`
- [x] 빌드 성공: `bun run build`
- [x] CreateBundleDialog를 독립적으로 마운트했을 때 유효성 검사 흐름이 동작한다

---

### Task 3: 갤러리에 custom bundle 통합 (표시 + 추가 + 삭제)

- **담당 시나리오**: S1 (갤러리 반영), S2 (자유 카테고리 → 필터 반영), S5 (삭제), S7 (새로고침 후 유지), S8 (카테고리 필터)
- **크기**: M (3 파일)
- **의존성**: Task 1, Task 2
- **참조**:
  - `components/gallery/BundleGallery.tsx` — 기존 filter 로직
  - `components/gallery/BundleCard.tsx` — 기존 카드 레이아웃
  - `lib/custom-bundles.ts`
- **구현 대상**:
  - `components/gallery/BundleGallery.tsx`
    - `useEffect`로 `loadCustomBundles()` 로드, static `BUNDLES`와 병합
    - "번들 추가하기" 버튼 → `CreateBundleDialog` 열기
    - 삭제 시 `deleteCustomBundle(id)` 호출 후 목록 갱신
    - 카테고리 필터: static + custom 번들에서 unique categories 동적 생성
  - `components/gallery/BundleCard.tsx`
    - `isCustom` prop 수신 시 삭제 버튼(Trash 아이콘) 표시
    - 삭제 버튼 클릭 시 확인 후 `onDelete` 콜백 호출
  - `components/gallery/BundleCard.test.tsx` — 삭제 버튼 테스트 추가
- **수용 기준**:
  - [x] `saveCustomBundle`로 저장된 번들이 갤러리에 카드로 나타나며 이름과 카테고리가 카드에 표시된다
  - [x] 사용자 번들 카드에만 삭제 버튼이 노출되고, 기본 번들 카드에는 없다
  - [x] 삭제 버튼 클릭 시 확인 UI가 표시되고, 취소하면 카드가 유지된다
  - [x] 삭제 버튼 클릭 후 확인하면 해당 카드가 갤러리에서 사라진다
  - [x] 새로고침 후에도 저장된 사용자 번들이 갤러리에 표시된다
  - [x] 사용자가 자유 입력한 카테고리(예: "내 전략")로 번들을 저장하면 해당 카테고리 필터 버튼이 갤러리에 노출된다
  - [x] "번들 추가하기" 버튼 클릭 시 CreateBundleDialog가 열린다
- **검증**: `bun run test -- BundleCard` | `bun run test -- BundleGallery`

---

### Task 4: 번들 상세 페이지에서 custom bundle 지원

- **담당 시나리오**: S6 (custom bundle → 최적화 흐름)
- **크기**: S (1 파일)
- **의존성**: Task 1, Task 3
- **참조**:
  - `components/bundle/BundleDetailView.tsx` — 기존 동기 로드 패턴
  - `components/results/ResultView.tsx` — `useState(undefined)` + `useEffect` 로드 패턴
  - `lib/custom-bundles.ts` — `getCustomBundleById`
- **구현 대상**:
  - `components/bundle/BundleDetailView.tsx`
    - `bundle` 로드를 `useEffect` + `useState(undefined | Bundle | null)`로 교체
    - `getBundleById` 없으면 `getCustomBundleById` 폴백
    - `undefined` → 로딩, `null` → `notFound()`
  - `components/bundle/BundleDetailView.test.tsx`
- **수용 기준**:
  - [x] `bundleId`가 custom bundle id일 때 해당 번들의 이름이 렌더링된다
  - [x] `bundleId`가 static bundle id일 때 static 번들 이름이 렌더링된다
  - [x] 존재하지 않는 id를 전달하면 `notFound()`가 호출된다 (로딩 완료 후 null 상태)
- **검증**: `bun run test -- BundleDetailView` + Browser MCP — `/bundle/<custom-id>` 접근 후 번들명 확인, 최적화 실행 → 결과 페이지 이동 확인, 증거 `artifacts/custom-bundle/evidence/task4.png` 저장

---

### Checkpoint: Tasks 3-4 이후 (최종)

- [x] 모든 테스트 통과: `bun run test`
- [x] 빌드 성공: `bun run build`
- [ ] 홈에서 번들 추가 → 갤러리 반영 → 상세 이동 → 최적화 실행 → 결과 페이지 도달 end-to-end 동작 (Human review)

---

## 제외 항목 (불변 규칙)

- 번들 생성 후 이름·종목 수정은 이번 범위 제외 — 상세 페이지에 편집 버튼을 추가하지 않는다
- 기본 제공 번들(`config/bundles.ts`)은 UI 및 저장소 레이어 양쪽에서 삭제 불가

## 미결정 항목

없음
