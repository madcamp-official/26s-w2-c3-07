alter table game_content.endings
  add column if not exists asset_url text;

alter table public.game_results
  add column if not exists report_text text,
  add column if not exists aftermath_text text,
  add column if not exists report_status text not null default 'PENDING',
  add column if not exists report_attempt_count integer not null default 0,
  add column if not exists report_last_attempt_at timestamptz,
  add column if not exists report_generated_at timestamptz,
  add constraint game_results_report_status_check
    check (report_status in ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED')),
  add constraint game_results_report_attempt_count_check
    check (report_attempt_count between 0 and 3),
  add constraint game_results_report_completion_check
    check (
      report_status <> 'COMPLETED'
      or (report_text is not null and aftermath_text is not null and report_generated_at is not null)
    );

create or replace function public.claim_ending_report_generation(
  p_user_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.game_sessions%rowtype;
  v_result public.game_results%rowtype;
begin
  select session.* into v_session
  from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id
  for update;

  if not found then
    raise exception 'ENDING_SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_session.status <> 'COMPLETED' then
    raise exception 'ENDING_SESSION_NOT_COMPLETED' using errcode = 'P0001';
  end if;

  select result.* into v_result
  from public.game_results as result
  where result.session_id = p_session_id
  for update;

  if not found then
    raise exception 'ENDING_RESULT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_result.report_status = 'COMPLETED' then
    return jsonb_build_object(
      'action', 'REUSE',
      'reportText', v_result.report_text,
      'aftermathText', v_result.aftermath_text,
      'generatedAt', v_result.report_generated_at
    );
  end if;

  if v_result.report_status = 'GENERATING'
     and v_result.report_last_attempt_at > now() - interval '2 minutes' then
    raise exception 'ENDING_REPORT_IN_PROGRESS' using errcode = 'P0001';
  end if;
  if v_result.report_attempt_count >= 3 then
    raise exception 'ENDING_REPORT_ATTEMPTS_EXHAUSTED' using errcode = 'P0001';
  end if;
  if v_result.report_last_attempt_at > now() - interval '30 seconds' then
    raise exception 'ENDING_REPORT_RATE_LIMITED' using errcode = 'P0001';
  end if;

  update public.game_results
  set report_status = 'GENERATING',
      report_attempt_count = report_attempt_count + 1,
      report_last_attempt_at = now()
  where id = v_result.id;

  return jsonb_build_object('action', 'GENERATE');
end;
$$;

create or replace function public.complete_ending_report_generation(
  p_user_id uuid,
  p_session_id uuid,
  p_report_text text,
  p_aftermath_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.game_results%rowtype;
begin
  if not exists (
    select 1 from public.game_sessions as session
    where session.id = p_session_id
      and session.user_id = p_user_id
      and session.status = 'COMPLETED'
  ) then
    raise exception 'ENDING_SESSION_NOT_COMPLETED' using errcode = 'P0001';
  end if;
  if char_length(trim(p_report_text)) not between 1 and 10000
     or char_length(trim(p_aftermath_text)) not between 1 and 10000 then
    raise exception 'ENDING_REPORT_INVALID' using errcode = 'P0001';
  end if;

  select result.* into v_result
  from public.game_results as result
  where result.session_id = p_session_id
  for update;

  if not found then
    raise exception 'ENDING_RESULT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_result.report_status = 'COMPLETED' then
    return jsonb_build_object(
      'reportText', v_result.report_text,
      'aftermathText', v_result.aftermath_text,
      'generatedAt', v_result.report_generated_at
    );
  end if;
  if v_result.report_status <> 'GENERATING' then
    raise exception 'ENDING_REPORT_NOT_CLAIMED' using errcode = 'P0001';
  end if;

  update public.game_results
  set report_text = trim(p_report_text),
      aftermath_text = trim(p_aftermath_text),
      report_status = 'COMPLETED',
      report_generated_at = now()
  where id = v_result.id
  returning * into v_result;

  return jsonb_build_object(
    'reportText', v_result.report_text,
    'aftermathText', v_result.aftermath_text,
    'generatedAt', v_result.report_generated_at
  );
end;
$$;

create or replace function public.fail_ending_report_generation(
  p_user_id uuid,
  p_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.game_results as result
  set report_status = 'FAILED'
  from public.game_sessions as session
  where result.session_id = p_session_id
    and session.id = result.session_id
    and session.user_id = p_user_id
    and session.status = 'COMPLETED'
    and result.report_status = 'GENERATING';
end;
$$;

revoke all on function public.claim_ending_report_generation(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_ending_report_generation(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.fail_ending_report_generation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_ending_report_generation(uuid, uuid) to service_role;
grant execute on function public.complete_ending_report_generation(uuid, uuid, text, text) to service_role;
grant execute on function public.fail_ending_report_generation(uuid, uuid) to service_role;
