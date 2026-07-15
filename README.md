# 그 뜻이 아니예라

한국 지역 사투리를 단서로 활용하는 AI 심문 추리 게임입니다. Next.js 프론트엔드는 화면과 입력만 담당하고, Express API가 인증, 게임 세션, 질문 제한, 심문 생성, 단서 해금, 추리 판정, 엔딩과 진행도를 관리합니다.

## 기술 스택

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Zod, OpenAI API
- Data/Auth: Supabase Auth, PostgreSQL, RLS, SQL RPC
- Tooling: pnpm workspace, Vitest, ESLint, GitHub Actions

## 디렉터리

```text
frontend/                 Next.js App Router UI
backend/src/modules/      도메인별 Express API
backend/supabase/         migration과 seed
backend/scripts/          콘텐츠 seed 실행 스크립트
.github/workflows/ci.yml  lint, test, build CI
```

## 사전 요구사항

- Node.js 22 이상
- pnpm 10.12 이상
- 로컬 DB 검증 시 Docker Desktop과 Supabase CLI
- 원격 실행 시 별도 Supabase 프로젝트
- 심문·보고서 생성을 위한 OpenAI API 키

## 설치와 환경변수

```bash
pnpm install --frozen-lockfile
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

백엔드 필수 환경변수:

```env
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

프론트 공개 환경변수:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_USE_MOCK_API=false
```

`SUPABASE_SERVICE_ROLE_KEY`는 백엔드에만 설정합니다. 실제 `.env`와 `.env.local`은 Git에서 제외됩니다.

## 데이터베이스 마이그레이션과 콘텐츠 입력

Supabase CLI 명령은 저장소의 `backend` 디렉터리에서 실행합니다. 로컬 설정은 `backend/supabase/config.toml`, SQL 이력은 `backend/supabase/migrations`에 있습니다. 콘텐츠는 SQL migration과 분리되어 있으며 TypeScript seed가 `code`/`id` 기준으로 upsert합니다.

```bash
cd backend
supabase start
supabase db reset
pnpm seed:content
```

`supabase db reset`은 빈 로컬 DB에 전체 migration을 순서대로 다시 적용합니다. `db.seed.enabled = false`이므로 reset 직후 `pnpm seed:content`를 별도로 실행해야 합니다. seed 실행에는 로컬 Supabase URL, anon key, service-role key가 설정된 `backend/.env`가 필요합니다.

원격 DB에는 자동 배포하지 않습니다. 배포 담당자가 대상 프로젝트와 migration diff를 확인한 뒤 아래처럼 수동 적용합니다.

```bash
cd backend
supabase link --project-ref <project-ref>
supabase db push --dry-run
supabase db push
pnpm seed:content
```

`db push`와 seed 전에 백업, 대상 project ref, 미적용 migration 목록을 반드시 확인합니다. 운영 DB를 대상으로 `db reset`을 실행하면 안 됩니다.

## 실행

루트에서 동시에 실행:

```bash
pnpm dev
```

개별 실행:

```bash
pnpm --filter ./backend dev
pnpm --filter ./frontend dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health check: http://localhost:4000/health

## 테스트와 빌드

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

CI는 `main`, `dev` 대상 push/PR에서 install, lint, test, build를 실행합니다. 단위 테스트는 외부 Supabase/OpenAI를 호출하지 않으며, migration 순서·핵심 컬럼·세션 상태·RPC 타입의 정적 일관성도 검사합니다. 실제 DB 트랜잭션 E2E는 로컬 Supabase 또는 별도 테스트 프로젝트 환경변수가 필요합니다.

## 주요 API 흐름

```text
회원가입/로그인
→ 지역 및 에피소드 조회
→ 서버 세션 생성
→ 증거 열람과 용의자 선택
→ OpenAI 심문 및 서버 단서 평가
→ 사건 기록 조회
→ 서버 최종 판정
→ 고정 엔딩과 선택적 보고서 생성
→ 진행도/사투리 기록 반영
```

프론트는 Supabase access token을 Bearer 헤더로 전달합니다. 질문 수, 만료 시간, 범인 판정, 단서 해금과 숨겨진 사건 정보는 서버만 관리합니다.

## 브랜치 전략

- `main`: 배포 기준 안정 브랜치. 검증된 `dev`만 fast-forward로 승격합니다.
- `dev`: 다음 배포 후보의 통합·검증 브랜치입니다.
- `feat/*`, `fix/*`, `chore/*`: 작업 브랜치. 최신 `dev`에서 분기하고 검증 후 `dev`에 병합합니다.
- `frontend`: 기존 UI 작업 이력을 보존하는 브랜치이며, 신규 통합 기준은 `dev`입니다.
- `integration/*`: 충돌 또는 브랜치 차이를 검증할 때만 사용하는 임시 통합 브랜치입니다.

## 알려진 제한 사항

- 실제 로그인/회원가입은 유효한 Supabase 프로젝트 설정이 필요합니다.
- 심문과 동적 보고서는 유효한 OpenAI API 키가 필요합니다.
- Google OAuth는 아직 구현되지 않아 UI에서 준비 중으로 표시합니다.
- Docker Desktop 또는 Supabase CLI가 없는 환경에서는 `supabase db reset`, seed, 실제 DB E2E를 검증할 수 없습니다.
- GitHub Actions는 실제 Supabase/OpenAI 자격 증명을 사용하지 않으므로 외부 서비스 통합은 배포 전 별도 환경에서 확인해야 합니다.

## 보안 운영 메모

- `SUPABASE_SERVICE_ROLE_KEY`와 `OPENAI_API_KEY`는 백엔드 비밀값이며 프론트 환경변수나 저장소에 넣지 않습니다.
- RLS와 service-role 전용 RPC 권한이 적용되어 있지만, 키 교체·비밀 스캔·의존성 취약점 대응은 운영 절차에서 지속적으로 수행해야 합니다.
- 자동 운영 migration, 운영 데이터 reset, OAuth 제공자 설정은 이 저장소의 CI 범위 밖이며 별도 승인과 백업 후 진행합니다.
- 현재 `LICENSE` 파일이 비어 있으므로 배포 전 프로젝트 라이선스 정책 결정이 필요합니다. 이번 작업에서는 임의의 라이선스를 선택하지 않았습니다.
