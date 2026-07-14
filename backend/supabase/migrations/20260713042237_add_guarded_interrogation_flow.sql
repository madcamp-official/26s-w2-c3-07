alter table public.game_sessions
  add column if not exists last_activity_at timestamptz not null default now();

alter table game_private.llm_request_logs
  add column if not exists purpose text not null default 'INTERROGATION';

create index if not exists interrogation_messages_session_suspect_created_idx
  on public.interrogation_messages (session_id, suspect_id, created_at);

create or replace function game_private.evaluate_interrogation_clues(
  p_session_id uuid,
  p_suspect_id uuid,
  p_used_fact_ids uuid[]
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.session_clues (session_id, clue_id, source)
  select p_session_id, condition.clue_id, 'INTERROGATION'
  from game_content.clue_unlock_conditions as condition
  join game_content.clues as clue on clue.id = condition.clue_id
  join game_content.suspect_facts as fact
    on fact.id = any (p_used_fact_ids)
   and fact.suspect_id = p_suspect_id
  join game_content.suspects as suspect on suspect.id = p_suspect_id
  join public.game_sessions as session
    on session.id = p_session_id
   and session.episode_id = clue.episode_id
   and session.episode_id = suspect.episode_id
  where condition.condition_type in ('fact_revealed', 'interrogation_fact')
    and condition.condition_data ->> 'fact_id' = fact.id::text
  on conflict (session_id, clue_id) do nothing;
$$;

create or replace function public.finalize_interrogation(
  p_user_id uuid,
  p_session_id uuid,
  p_request_id uuid,
  p_suspect_id uuid,
  p_question text,
  p_dialect_response text,
  p_question_type text,
  p_emotion text,
  p_used_fact_ids uuid[],
  p_evasion_type text,
  p_consistency_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.game_sessions%rowtype;
  v_state public.session_suspect_states%rowtype;
  v_existing public.interrogation_messages%rowtype;
  v_message public.interrogation_messages%rowtype;
  v_questions_per_suspect integer;
begin
  select session.* into v_session
  from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id
  for update;

  if not found then
    raise exception 'INTERROGATION_SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select message.* into v_existing
  from public.interrogation_messages as message
  where message.session_id = p_session_id
    and message.request_id = p_request_id::text;

  if found then
    return jsonb_build_object('duplicate', true, 'message', to_jsonb(v_existing));
  end if;

  if v_session.status <> 'INTERROGATING' then
    raise exception 'INTERROGATION_STATE_INVALID' using errcode = 'P0001';
  end if;
  if v_session.expires_at <= now() then
    raise exception 'INTERROGATION_SESSION_EXPIRED' using errcode = 'P0001';
  end if;
  if v_session.remaining_questions <= 0 then
    raise exception 'INTERROGATION_QUESTIONS_EXHAUSTED' using errcode = 'P0001';
  end if;
  if p_question_type not in ('Q-TIME','Q-PLACE','Q-RELATION','Q-MOTIVE','Q-EVIDENCE','Q-OTHER','Q-CONTRADICTION','Q-ACCUSATION','Q-PROMPT','Q-SMALLTALK','Q-UNKNOWN')
    or p_emotion not in ('CALM','NEUTRAL','NERVOUS','DEFENSIVE','ANGRY','FEARFUL','GUILTY','SAD','BREAKDOWN','MOCKING','AGGRESSIVE_DEFENSIVE')
    or p_evasion_type not in ('NONE','PARTIAL_ANSWER','DENIAL','DEFLECTION','UNKNOWN','PROMPT_REJECTION')
    or p_consistency_status not in ('VALID','INVALID')
    or char_length(p_question) not between 2 and 500
    or char_length(p_dialect_response) not between 2 and 500 then
    raise exception 'INTERROGATION_PAYLOAD_INVALID' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from game_content.suspects as suspect
    where suspect.id = p_suspect_id and suspect.episode_id = v_session.episode_id
  ) then
    raise exception 'INTERROGATION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001';
  end if;
  if v_session.current_suspect_id is distinct from p_suspect_id then
    raise exception 'INTERROGATION_SUSPECT_NOT_SELECTED' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_used_fact_ids, array[]::uuid[])) as used_fact(used_fact_id)
    where not exists (
      select 1 from game_content.suspect_facts as fact
      where fact.id = used_fact.used_fact_id and fact.suspect_id = p_suspect_id
    )
  ) then
    raise exception 'INTERROGATION_FACT_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select state.* into v_state
  from public.session_suspect_states as state
  where state.session_id = p_session_id and state.suspect_id = p_suspect_id
  for update;
  if not found then
    raise exception 'INTERROGATION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001';
  end if;

  select config.questions_per_suspect into v_questions_per_suspect
  from game_content.episode_difficulty_configs as config
  where config.id = v_session.difficulty_config_id
    and config.episode_id = v_session.episode_id;
  if v_state.questions_asked >= v_questions_per_suspect then
    raise exception 'INTERROGATION_SUSPECT_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  insert into public.interrogation_messages (
    session_id, suspect_id, request_id, question, answer, dialect_response,
    response_metadata, status
  ) values (
    p_session_id, p_suspect_id, p_request_id::text, p_question,
    p_dialect_response, p_dialect_response,
    jsonb_build_object(
      'questionType', p_question_type,
      'emotion', p_emotion,
      'usedFactIds', to_jsonb(p_used_fact_ids),
      'evasionType', p_evasion_type,
      'consistencyStatus', p_consistency_status
    ),
    'completed'
  ) returning * into v_message;

  update public.game_sessions
  set remaining_questions = remaining_questions - 1,
      last_activity_at = now()
  where id = p_session_id;

  update public.session_suspect_states
  set emotion = p_emotion,
      questions_asked = questions_asked + 1,
      state = jsonb_set(
        jsonb_set(state, '{revealedFactIds}', (
          select coalesce(jsonb_agg(revealed_id), '[]'::jsonb)
          from (
            select jsonb_array_elements_text(coalesce(state -> 'revealedFactIds', '[]'::jsonb)) as revealed_id
            union
            select used_fact_id::text
            from unnest(coalesce(p_used_fact_ids, array[]::uuid[])) as used(used_fact_id)
          ) as revealed
        ), true),
        '{lastEvasionType}', to_jsonb(p_evasion_type), true
      ),
      updated_at = now()
  where id = v_state.id;

  perform game_private.evaluate_interrogation_clues(
    p_session_id, p_suspect_id, p_used_fact_ids
  );

  return jsonb_build_object('duplicate', false, 'message', to_jsonb(v_message));
end;
$$;

revoke all on function game_private.evaluate_interrogation_clues(uuid, uuid, uuid[])
  from public, anon, authenticated;
revoke all on function public.finalize_interrogation(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid[], text, text
) from public, anon, authenticated;
grant execute on function public.finalize_interrogation(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid[], text, text
) to service_role;
