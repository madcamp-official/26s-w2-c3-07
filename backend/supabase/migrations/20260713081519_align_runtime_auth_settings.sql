alter table public.user_settings
  add column if not exists locale text not null default 'ko'
  check (locale in ('ko', 'en'));

-- The backend is the only consumer of these private schemas. Exposing a
-- schema to PostgREST does not grant anon/authenticated access; the existing
-- schema and table grants continue to deny those roles.
alter role authenticator
  set pgrst.db_schemas = 'public, graphql_public, game_content, game_private';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
