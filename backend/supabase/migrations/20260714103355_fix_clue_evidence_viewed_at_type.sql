create or replace function game_private.evaluate_clue_unlocks_with_evidence(
  p_session_id uuid,
  p_source text default 'SERVER',
  p_current_message_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch uuid[];
  v_new_clue_ids uuid[] := array[]::uuid[];
  v_new_evidence_ids uuid[] := array[]::uuid[];
  v_evidence_batch uuid[];
begin
  loop
    with eligible as (
      select clue.id
      from public.game_sessions as session
      join game_content.clues as clue on clue.episode_id = session.episode_id
      where session.id = p_session_id
        and not exists (
          select 1 from public.session_clues as acquired
          where acquired.session_id = p_session_id and acquired.clue_id = clue.id
        )
        and exists (
          select 1 from game_content.clue_unlock_conditions as condition
          where condition.clue_id = clue.id
        )
        and exists (
          select 1
          from (
            select condition.group_no,
              bool_and(game_private.clue_condition_is_met(
                p_session_id, condition.id, p_current_message_id
              )) as satisfied
            from game_content.clue_unlock_conditions as condition
            where condition.clue_id = clue.id
            group by condition.group_no
          ) as condition_group
          where condition_group.satisfied
        )
    ), inserted as (
      insert into public.session_clues (
        session_id, clue_id, acquired_from_type, acquired_from_ref, acquired_at
      )
      select p_session_id, eligible.id, left(coalesce(p_source, 'SERVER'), 100),
        p_current_message_id::text, now()
      from eligible
      on conflict (session_id, clue_id) do nothing
      returning clue_id
    )
    select coalesce(array_agg(inserted.clue_id), array[]::uuid[])
    into v_batch
    from inserted;

    exit when cardinality(v_batch) = 0;
    v_new_clue_ids := v_new_clue_ids || v_batch;

    with inserted_evidence as (
      insert into public.session_evidence (session_id, evidence_id, source_type, viewed_at)
      select distinct p_session_id, unlock.evidence_id, unlock.source_type, null::timestamptz
      from game_content.clue_evidence_unlocks as unlock
      join public.game_sessions as session on session.id = p_session_id
      join game_content.evidence as evidence
        on evidence.id = unlock.evidence_id and evidence.episode_id = session.episode_id
      where unlock.clue_id = any(v_batch)
      on conflict (session_id, evidence_id) do nothing
      returning evidence_id
    )
    select coalesce(array_agg(inserted_evidence.evidence_id), array[]::uuid[])
    into v_evidence_batch
    from inserted_evidence;

    v_new_evidence_ids := v_new_evidence_ids || v_evidence_batch;
  end loop;

  return jsonb_build_object(
    'newClueIds', to_jsonb(v_new_clue_ids),
    'newEvidenceIds', to_jsonb(v_new_evidence_ids)
  );
end;
$$;

revoke all on function game_private.evaluate_clue_unlocks_with_evidence(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function game_private.evaluate_clue_unlocks_with_evidence(uuid, text, uuid)
  to service_role;


