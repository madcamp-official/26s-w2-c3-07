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
- Supabase 프로젝트 또는 Supabase CLI 로컬 환경
- 심문·보고서 생성을 위한 OpenAI API 키

## 설치와 환경변수

```bash
pnpm install
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

## 데이터베이스 생성과 콘텐츠 입력

Supabase CLI 명령은 `backend`에서 실행합니다.

```bash
cd backend
pnpm exec supabase start
pnpm exec supabase db reset
pnpm seed:content
```

원격 프로젝트에 적용할 때는 프로젝트 연결과 migration 검토 후 Supabase CLI의 `db push`를 사용합니다. 콘텐츠 seed는 `code`/`id` 기준 upsert라 반복 실행해도 중복되지 않습니다.

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
pnpm lint
pnpm test
pnpm build
```

CI 단위 테스트는 외부 Supabase/OpenAI를 호출하지 않습니다. 실제 DB 트랜잭션 E2E는 로컬 Supabase 또는 별도 테스트 프로젝트 환경변수가 필요합니다.

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

- `main`: 직접 수정하지 않는 안정 브랜치
- `dev`: 기능 통합 브랜치
- `feat/*`: 백엔드 도메인 기능 브랜치
- `frontend`: UI 개발 브랜치
- `integration/*`: diverged 브랜치의 검증용 임시 통합 브랜치

## 알려진 제한 사항

- 실제 로그인/회원가입은 유효한 Supabase 프로젝트 설정이 필요합니다.
- 심문과 동적 보고서는 유효한 OpenAI API 키가 필요합니다.
- Google OAuth는 아직 구현되지 않아 UI에서 준비 중으로 표시합니다.
- 로컬 Supabase가 실행되지 않은 환경에서는 migration 적용 및 실제 DB E2E를 검증할 수 없습니다.
