create or replace function game_content.question_type_label_ko(p_code text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select case p_code
    when 'Q-TIME' then '시간 질문'
    when 'Q-PLACE' then '장소 질문'
    when 'Q-RELATION' then '관계 질문'
    when 'Q-MOTIVE' then '동기 질문'
    when 'Q-EVIDENCE' then '증거 질문'
    when 'Q-OTHER' then '일반 질문'
    when 'Q-CONTRADICTION' then '모순 추궁'
    when 'Q-ACCUSATION' then '혐의 추궁'
    when 'Q-PROMPT' then '프롬프트 조작 시도'
    when 'Q-SMALLTALK' then '잡담'
    when 'Q-UNKNOWN' then '분류 불가 질문'
    else p_code
  end
$$;

create or replace function game_content.emotion_label_ko(p_code text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select case p_code
    when 'CALM' then '침착'
    when 'NEUTRAL' then '중립'
    when 'NERVOUS' then '불안'
    when 'DEFENSIVE' then '방어적'
    when 'ANGRY' then '분노'
    when 'FEARFUL' then '공포'
    when 'GUILTY' then '죄책감'
    when 'SAD' then '슬픔'
    when 'BREAKDOWN' then '감정 붕괴'
    when 'MOCKING' then '조롱'
    when 'AGGRESSIVE_DEFENSIVE' then '공격적 방어'
    else p_code
  end
$$;

create or replace function game_content.emotion_trigger_label_ko(p_code text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select case p_code
    when 'ACCUSATION' then '혐의 추궁'
    when 'EVIDENCE_PRESENTED' then '증거 제시'
    when 'LIE_CONTRADICTED' then '거짓말 모순 지적'
    when 'PROTECTION_OFFERED' then '보호 제안'
    when 'QUESTION_TYPE' then '질문 유형 조건'
    when 'RELATION_MENTIONED' then '관계 언급'
    else p_code
  end
$$;

alter table game_content.suspects
  add column if not exists initial_emotion_ko text
  generated always as (game_content.emotion_label_ko(initial_emotion)) stored;

alter table game_content.suspect_response_rules
  add column if not exists question_type_ko text
  generated always as (game_content.question_type_label_ko(question_type)) stored;

alter table game_content.suspect_emotion_rules
  add column if not exists trigger_type_ko text
  generated always as (game_content.emotion_trigger_label_ko(trigger_type)) stored,
  add column if not exists from_emotion_ko text
  generated always as (game_content.emotion_label_ko(from_emotion)) stored,
  add column if not exists to_emotion_ko text
  generated always as (game_content.emotion_label_ko(to_emotion)) stored;

alter table public.session_suspect_states
  add column if not exists current_emotion_ko text
  generated always as (game_content.emotion_label_ko(current_emotion)) stored;

alter table public.interrogation_messages
  add column if not exists question_type_ko text
  generated always as (game_content.question_type_label_ko(question_type)) stored,
  add column if not exists emotion_before_ko text
  generated always as (game_content.emotion_label_ko(emotion_before)) stored,
  add column if not exists emotion_after_ko text
  generated always as (game_content.emotion_label_ko(emotion_after)) stored;

alter table game_private.llm_request_logs
  add column if not exists question_type_ko text
  generated always as (
    game_content.question_type_label_ko(metadata ->> 'questionType')
  ) stored;

comment on function game_content.question_type_label_ko(text)
  is '심문 질문 유형 내부 코드를 한국어 표시명으로 변환한다.';
comment on function game_content.emotion_label_ko(text)
  is '심문 감정 내부 코드를 한국어 표시명으로 변환한다.';
comment on function game_content.emotion_trigger_label_ko(text)
  is '감정 전환 트리거 내부 코드를 한국어 표시명으로 변환한다.';

comment on column game_content.suspect_response_rules.question_type_ko
  is 'question_type의 한국어 표시명. 내부 분기에는 question_type을 사용한다.';
comment on column game_content.suspect_emotion_rules.trigger_type_ko
  is 'trigger_type의 한국어 표시명.';
comment on column game_content.suspect_emotion_rules.from_emotion_ko
  is 'from_emotion의 한국어 표시명.';
comment on column game_content.suspect_emotion_rules.to_emotion_ko
  is 'to_emotion의 한국어 표시명.';
comment on column public.session_suspect_states.current_emotion_ko
  is 'current_emotion의 한국어 표시명.';
comment on column public.interrogation_messages.question_type_ko
  is 'question_type의 한국어 표시명.';
comment on column public.interrogation_messages.emotion_before_ko
  is 'emotion_before의 한국어 표시명.';
comment on column public.interrogation_messages.emotion_after_ko
  is 'emotion_after의 한국어 표시명.';
comment on column game_private.llm_request_logs.question_type_ko
  is 'metadata.questionType의 한국어 표시명.';
