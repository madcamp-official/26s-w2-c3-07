alter table public.user_settings
  add column if not exists locale text not null default 'ko'
  check (locale in ('ko', 'en'));

alter role authenticator
  set pgrst.db_schemas = 'public, graphql_public, game_content, game_private';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
