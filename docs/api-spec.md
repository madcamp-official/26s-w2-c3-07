# API 명세서

## 기본 규칙

- Base URL: 프론트의 `NEXT_PUBLIC_API_BASE_URL` + `/api`
- 인증: Supabase access token을 `Authorization: Bearer <token>`으로 전달
- 본문: `Content-Type: application/json`
- 세션 관련 경로의 `:sessionId`는 서버가 확인한 UUID를 사용한다.

## 주요 endpoint

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | `/auth/sign-up` | 이메일, 비밀번호, 표시 이름으로 가입 | 불필요 |
| POST | `/auth/sign-in` | 이메일과 비밀번호 로그인 | 불필요 |
| GET/PATCH | `/auth/me` | 내 프로필 조회·수정 | 필요 |
| GET/PATCH | `/auth/settings` | 음향·텍스트 설정 조회·수정 | 필요 |
| GET | `/regions` | 활성 지역 목록 | 불필요 |
| GET | `/regions/:regionId/episodes` | 지역별 공개 사건과 선택적 진행 상태 | 선택 |
| GET | `/episodes/:episodeKey` | 사건 상세 | 불필요 |
| GET | `/episodes/:episodeKey/difficulties` | 난이도 설정 | 불필요 |
| GET | `/episodes/:episodeKey/scene` | 사건 도입 장면 | 불필요 |
| GET | `/episodes/:episodeKey/suspects` | 용의자 공개 목록 | 불필요 |
| GET | `/episodes/:episodeKey/suspects/:suspectId` | 용의자 공개 상세 | 불필요 |
| POST | `/sessions` | 에피소드·난이도로 게임 세션 생성 | 필요 |
| GET | `/sessions/active` | 진행 중인 내 세션 | 필요 |
| GET | `/sessions/resolve/:sessionKey` | UUID 또는 에피소드 코드로 내 세션 해석 | 필요 |
| GET | `/sessions/:sessionId` | 세션 상태 조회 | 필요 |
| PATCH | `/sessions/:sessionId/current-suspect` | 현재 용의자 선택 | 필요 |
| POST | `/sessions/:sessionId/enter-deduction` | 추리 단계 진입 | 필요 |
| POST | `/sessions/:sessionId/abandon` | 세션 포기 | 필요 |
| GET | `/sessions/:sessionId/evidence` | 사용 가능한 증거 목록 | 필요 |
| POST | `/sessions/:sessionId/evidence/:evidenceId/view` | 증거 열람과 연쇄 해금 평가 | 필요 |
| GET | `/sessions/:sessionId/clues` | 획득 단서 조회와 기존 메시지 재평가 | 필요 |
| GET/POST | `/sessions/:sessionId/interrogations` | 전체 심문 이력 조회·질문 생성 | 필요 |
| GET | `/sessions/:sessionId/suspects/:suspectId/interrogations` | 용의자별 심문 이력 | 필요 |
| GET | `/sessions/:sessionId/records` | 사건 기록 통합 조회 | 필요 |
| GET | `/sessions/:sessionId/records/testimonies` | 증언 기록 | 필요 |
| GET | `/sessions/:sessionId/records/timeline` | 타임라인 | 필요 |
| GET | `/sessions/:sessionId/records/relationships` | 공개·획득 관계 | 필요 |
| POST/PATCH/DELETE | `/sessions/:sessionId/notes[/:noteId]` | 메모 생성·수정·삭제 | 필요 |
| POST | `/sessions/:sessionId/deduction` | 최종 용의자 지목 | 필요 |
| GET | `/sessions/:sessionId/result` | 판정과 점수 | 필요 |
| GET | `/sessions/:sessionId/ending` | 고정 엔딩 조회 | 필요 |
| POST | `/sessions/:sessionId/ending/report` | 선택적 동적 보고서 생성 | 필요 |
| GET | `/progress` | 사용자 진행 요약 | 필요 |
| GET | `/progress/episodes` | 사건별 진행도 | 필요 |
| GET | `/progress/history` | 페이지별 플레이 이력 | 필요 |
| GET | `/progress/dialects` | 해금 사투리 | 필요 |

## 대표 요청과 응답

### 세션 생성

```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{"episodeId":"<uuid>","difficulty":"normal"}
```

응답에는 세션 ID, 에피소드 코드, 상태, 난이도, 남은 질문 수와 만료 시각이 포함된다.

### 심문 질문

```http
POST /api/sessions/<session-id>/interrogations
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId":"<uuid>",
  "suspectId":"<uuid>",
  "question":"사건 당시 어디에 있었습니까?",
  "presentedEvidenceIds":[]
}
```

응답에는 저장된 메시지, 남은 질문 수, 이번 요청에서 새로 획득한 단서와 증거가 포함된다. 같은 `requestId` 재요청은 기존 결과를 반환한다.

### 최종 추리

```http
POST /api/sessions/<session-id>/deduction
Authorization: Bearer <token>
Content-Type: application/json

{"selectedSuspectId":"<uuid>"}
```

응답은 정답 여부, 해결 유형, 점수와 결과·엔딩 조회에 필요한 세션 상태를 제공한다. 범인 판정은 서버에서만 수행한다.

## 공통 오류

오류 응답은 HTTP 상태와 함께 서버 오류 코드와 메시지를 JSON으로 반환한다. 대표 범주는 다음과 같다.

| HTTP | 의미 |
|---|---|
| 400 | 요청 형식, 세션 상태, 질문·증거 조건 오류 |
| 401 | access token 누락 또는 무효 |
| 404 | 리소스 없음 또는 소유하지 않은 세션 |
| 409 | 중복·상태 충돌 |
| 429 | 요청 제한 |
| 500/502 | 서버 또는 외부 LLM 처리 실패 |

내부 DB 구조, 서비스 키, 비공개 fact와 원본 프롬프트는 응답에 포함하지 않는다.
