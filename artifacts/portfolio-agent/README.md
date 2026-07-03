# 포트폴리오 에이전트 — 와이어프레임 (Vercel)

`my-quant` **`main`** 브랜치의 `artifacts/portfolio-agent/` 에 있습니다. (개발 브랜치 `cursor/portfolio-agent-spec-f106`와 동일 내용)

| 파일 | 설명 |
|---|---|
| [idea.md](idea.md) | 제품 방향 |
| [spec.md](spec.md) | 23 시나리오 |
| [wireframe.html](wireframe.html) | 9화면 UI |
| [plan.md](plan.md) | 구현 계획 |

## Vercel에서 와이어프레임 보기

### 1. 새 프로젝트 (권장)

1. [vercel.com/new](https://vercel.com/new) → **Import** `se-hscho/my-quant`
2. **Root Directory** → `Edit` → `artifacts/portfolio-agent` 입력
3. **Framework Preset** → **Other**
4. **Production Branch** → `cursor/portfolio-agent-spec-f106` (또는 Deploy 후 Preview만 사용)
5. **Deploy**

배포 URL 루트(`/`)가 `wireframe.html`로 연결됩니다 (`vercel.json` rewrites).

### 2. 기존 my-quant 프로젝트에 Preview만

같은 레포를 이미 쓰는 경우:

1. Vercel 프로젝트 → **Settings** → **Git** → Production Branch는 `main` 유지
2. `cursor/portfolio-agent-spec-f106`에 push하면 **Preview Deployment** 생성
3. Preview URL에서 와이어프레임을 보려면 해당 배포의 **Root Directory**가 `artifacts/portfolio-agent`인 **별도 프로젝트**가 필요합니다 (Next.js 루트와 충돌 방지)

→ 와이어프레임 전용은 **별도 Vercel 프로젝트** + Root `artifacts/portfolio-agent`가 가장 단순합니다.

### 3. 로컬

```bash
cd artifacts/portfolio-agent
python3 -m http.server 3456 --bind 0.0.0.0
# http://localhost:3456/wireframe.html
```

와이어프레임 상단 **Mobile / Desktop** 토글로 폰 레이아웃 확인.

## 브랜치

```bash
git checkout cursor/portfolio-agent-spec-f106
git pull origin cursor/portfolio-agent-spec-f106
```

와이어프레임·스펙 수정 후 이 브랜치에 push → Vercel이 자동 재배포합니다.
