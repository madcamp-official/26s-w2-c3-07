create or replace function public.finalize_interrogation(
  p_user_id uuid, p_session_id uuid, p_request_id uuid, p_suspect_id uuid,
  p_question text, p_dialect_response text, p_question_type text, p_emotion text,
  p_used_fact_ids uuid[], p_revealed_fact_ids uuid[], p_claimed_fact_ids uuid[],
  p_presented_evidence_ids uuid[], p_evasion_type text, p_consistency_status text,
  p_response_metadata jsonb
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
  v_unlock_result jsonb;
  v_effective_rule_type text;
begin
  select session.* into v_session from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id for update;
  if not found then raise exception 'INTERROGATION_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;

  select message.* into v_existing from public.interrogation_messages as message
  where message.request_id = p_request_id;
  if found then
    if v_existing.session_id <> p_session_id then
      raise exception 'INTERROGATION_REQUEST_ID_CONFLICT' using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'duplicate', true, 'message', to_jsonb(v_existing),
      'newClueIds', '[]'::jsonb, 'newEvidenceIds', '[]'::jsonb,
      'remainingQuestions', v_session.remaining_questions
    );
  end if;

  if v_session.status <> 'INTERROGATING' then raise exception 'INTERROGATION_STATE_INVALID' using errcode = 'P0001'; end if;
  if v_session.expires_at <= now() then raise exception 'INTERROGATION_SESSION_EXPIRED' using errcode = 'P0001'; end if;
  if v_session.remaining_questions <= 0 then raise exception 'INTERROGATION_QUESTIONS_EXHAUSTED' using errcode = 'P0001'; end if;
  if v_session.current_suspect_id is distinct from p_suspect_id then raise exception 'INTERROGATION_SUSPECT_NOT_SELECTED' using errcode = 'P0001'; end if;
  if char_length(btrim(p_question)) not between 2 and 500
     or char_length(btrim(p_dialect_response)) not between 2 and 500
     or p_consistency_status not in ('valid', 'invalid')
  then raise exception 'INTERROGATION_PAYLOAD_INVALID' using errcode = 'P0001'; end if;

  if exists (
    select 1 from unnest(coalesce(p_presented_evidence_ids, array[]::uuid[])) as presented(evidence_id)
    where not exists (
      select 1 from public.session_evidence as available
      join game_content.evidence as evidence on evidence.id = available.evidence_id
      where available.session_id = p_session_id
        and available.evidence_id = presented.evidence_id
        and evidence.episode_id = v_session.episode_id
    )
  ) then raise exception 'INTERROGATION_EVIDENCE_NOT_AVAILABLE' using errcode = 'P0001'; end if;

  v_effective_rule_type := coalesce(
    nullif(p_response_metadata ->> 'effectiveRuleType', ''),
    p_question_type
  );

  if exists (
    select 1
    from unnest(
      coalesce(p_used_fact_ids, array[]::uuid[])
      || coalesce(p_revealed_fact_ids, array[]::uuid[])
      || coalesce(p_claimed_fact_ids, array[]::uuid[])
    ) as referenced(fact_id)
    where not exists (
      select 1
      from game_content.suspect_facts as fact
      where fact.id = referenced.fact_id
        and fact.suspect_id = p_suspect_id
        and fact.disclosure_level <> 'SERVER_ONLY'
        and (
          exists (
            select 1
            from public.interrogation_messages as prior
            cross join lateral jsonb_array_elements_text(prior.revealed_fact_refs) as revealed(fact_id)
            where prior.session_id = p_session_id
              and revealed.fact_id = fact.id::text
          )
          or (
            not exists (
              select 1
              from game_content.suspect_response_rules as hidden_rule
              where hidden_rule.suspect_id = p_suspect_id
                and hidden_rule.question_type = v_effective_rule_type
                and (
                  hidden_rule.hidden_fact_refs ? fact.id::text
                  or hidden_rule.hidden_fact_refs ? fact.code
                )
            )
            and (
              fact.disclosure_level = 'LLM_ALLOWED'
              or exists (
                select 1
                from game_content.suspect_response_rules as allowed_rule
                where allowed_rule.suspect_id = p_suspect_id
                  and allowed_rule.question_type = v_effective_rule_type
                  and (
                    allowed_rule.allowed_fact_refs ? fact.id::text
                    or allowed_rule.allowed_fact_refs ? fact.code
                  )
              )
            )
          )
        )
    )
  ) then
    raise exception 'INTERROGATION_FACT_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select state.* into v_state from public.session_suspect_states as state
  where state.session_id = p_session_id and state.suspect_id = p_suspect_id for update;
  if not found then raise exception 'INTERROGATION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001'; end if;

  select config.questions_per_suspect into v_questions_per_suspect
  from game_content.episode_difficulty_configs as config
  where config.id = v_session.difficulty_config_id
    and config.episode_id = v_session.episode_id;
  if v_state.questions_used >= v_questions_per_suspect then
    raise exception 'INTERROGATION_SUSPECT_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  insert into public.interrogation_messages (
    session_id, suspect_id, request_id, user_question, question_type, npc_response,
    emotion_before, emotion_after, evasion_type, used_fact_refs, revealed_fact_refs,
    claimed_fact_refs, presented_evidence_refs, question_cost, response_metadata
  ) values (
    p_session_id, p_suspect_id, p_request_id, btrim(p_question), p_question_type,
    btrim(p_dialect_response), v_state.current_emotion, p_emotion, p_evasion_type,
    to_jsonb(coalesce(p_used_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_revealed_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_claimed_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_presented_evidence_ids, array[]::uuid[])), 1,
    coalesce(p_response_metadata, '{}'::jsonb)
      || jsonb_build_object('characterConsistencyStatus', p_consistency_status)
  ) returning * into v_message;

  update public.game_sessions
  set remaining_questions = remaining_questions - 1,
      last_activity_at = now(), updated_at = now()
  where id = p_session_id
  returning remaining_questions into v_session.remaining_questions;

  update public.session_suspect_states
  set current_emotion = p_emotion,
      questions_used = questions_used + 1,
      interrogation_status = case
        when questions_used + 1 >= v_questions_per_suspect then 'EXHAUSTED'
        else 'AVAILABLE'
      end,
      last_interrogated_at = now(), updated_at = now()
  where id = v_state.id;

  v_unlock_result := game_private.evaluate_clue_unlocks_with_evidence(
    p_session_id, 'INTERROGATION', v_message.id
  );
  return jsonb_build_object(
    'duplicate', false, 'message', to_jsonb(v_message),
    'newClueIds', v_unlock_result -> 'newClueIds',
    'newEvidenceIds', v_unlock_result -> 'newEvidenceIds',
    'remainingQuestions', v_session.remaining_questions
  );
end;
$$;
