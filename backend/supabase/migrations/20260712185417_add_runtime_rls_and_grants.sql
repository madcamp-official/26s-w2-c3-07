create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy user_settings_select_own
on public.user_settings
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_settings_update_own
on public.user_settings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy game_sessions_select_own
on public.game_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy session_suspect_states_select_own
on public.session_suspect_states
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_suspect_states.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy interrogation_messages_select_own
on public.interrogation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = interrogation_messages.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy session_evidence_select_own
on public.session_evidence
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_evidence.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy session_clues_select_own
on public.session_clues
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_clues.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy session_notes_select_own
on public.session_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_notes.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy session_notes_insert_own
on public.session_notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_notes.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy session_notes_update_own
on public.session_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_notes.session_id
      and gs.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_notes.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy session_notes_delete_own
on public.session_notes
for delete
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = session_notes.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy game_results_select_own
on public.game_results
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions gs
    where gs.id = game_results.session_id
      and gs.user_id = (select auth.uid())
  )
);

create policy user_episode_progress_select_own
on public.user_episode_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_dialect_unlocks_select_own
on public.user_dialect_unlocks
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon;

revoke all on public.profiles from authenticated;
revoke all on public.user_settings from authenticated;
revoke all on public.game_sessions from authenticated;
revoke all on public.session_suspect_states from authenticated;
revoke all on public.interrogation_messages from authenticated;
revoke all on public.session_evidence from authenticated;
revoke all on public.session_clues from authenticated;
revoke all on public.session_notes from authenticated;
revoke all on public.game_results from authenticated;
revoke all on public.user_episode_progress from authenticated;
revoke all on public.user_dialect_unlocks from authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.user_settings to authenticated;
grant select on public.game_sessions to authenticated;
grant select on public.session_suspect_states to authenticated;
grant select on public.interrogation_messages to authenticated;
grant select on public.session_evidence to authenticated;
grant select on public.session_clues to authenticated;
grant select, insert, update, delete on public.session_notes to authenticated;
grant select on public.game_results to authenticated;
grant select on public.user_episode_progress to authenticated;
grant select on public.user_dialect_unlocks to authenticated;

grant usage on schema public to authenticated;

grant all privileges on public.profiles to service_role;
grant all privileges on public.user_settings to service_role;
grant all privileges on public.game_sessions to service_role;
grant all privileges on public.session_suspect_states to service_role;
grant all privileges on public.interrogation_messages to service_role;
grant all privileges on public.session_evidence to service_role;
grant all privileges on public.session_clues to service_role;
grant all privileges on public.session_notes to service_role;
grant all privileges on public.game_results to service_role;
grant all privileges on public.user_episode_progress to service_role;
grant all privileges on public.user_dialect_unlocks to service_role;

grant all privileges on all sequences in schema public to service_role;
