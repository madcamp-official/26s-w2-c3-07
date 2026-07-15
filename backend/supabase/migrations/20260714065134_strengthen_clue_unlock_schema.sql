alter table public.interrogation_messages
  add column if not exists revealed_fact_refs jsonb not null default '[]'::jsonb,
  add column if not exists claimed_fact_refs jsonb not null default '[]'::jsonb,
  add column if not exists presented_evidence_refs jsonb not null default '[]'::jsonb;

alter table public.interrogation_messages
  drop constraint if exists interrogation_messages_revealed_fact_refs_array_check,
  add constraint interrogation_messages_revealed_fact_refs_array_check
    check (jsonb_typeof(revealed_fact_refs) = 'array'),
  drop constraint if exists interrogation_messages_claimed_fact_refs_array_check,
  add constraint interrogation_messages_claimed_fact_refs_array_check
    check (jsonb_typeof(claimed_fact_refs) = 'array'),
  drop constraint if exists interrogation_messages_presented_evidence_refs_array_check,
  add constraint interrogation_messages_presented_evidence_refs_array_check
    check (jsonb_typeof(presented_evidence_refs) = 'array');

comment on column public.interrogation_messages.used_fact_refs is
  'Facts used internally to generate the NPC response. Must not by itself unlock clues.';
comment on column public.interrogation_messages.revealed_fact_refs is
  'Fact IDs explicitly revealed to the player in the final NPC response.';
comment on column public.interrogation_messages.claimed_fact_refs is
  'Fact or claim IDs asserted by the NPC; claims may be false and are used for contradiction checks.';
comment on column public.interrogation_messages.presented_evidence_refs is
  'Evidence IDs explicitly presented by the player during this interrogation turn.';

create index if not exists interrogation_messages_revealed_fact_refs_gin
  on public.interrogation_messages using gin (revealed_fact_refs);
create index if not exists interrogation_messages_claimed_fact_refs_gin
  on public.interrogation_messages using gin (claimed_fact_refs);
create index if not exists interrogation_messages_presented_evidence_refs_gin
  on public.interrogation_messages using gin (presented_evidence_refs);

create table if not exists game_content.evidence_clue_links (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  evidence_id uuid not null references game_content.evidence(id) on delete cascade,
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  link_type text not null check (link_type in (
    'SUPPORTS', 'REVEALS', 'CONTRADICTS', 'CORROBORATES',
    'REQUIRED_WITH', 'EXCLUDES', 'RED_HERRING'
  )),
  explanation text not null check (char_length(btrim(explanation)) > 0),
  strength smallint not null default 100 check (strength between 0 and 100),
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (evidence_id, clue_id, link_type)
);

comment on table game_content.evidence_clue_links is
  'SERVER CONTENT: explicit many-to-many links describing how raw evidence contributes to derived clues.';

create index if not exists evidence_clue_links_episode_idx
  on game_content.evidence_clue_links (episode_id);
create index if not exists evidence_clue_links_clue_idx
  on game_content.evidence_clue_links (clue_id);
create index if not exists evidence_clue_links_evidence_idx
  on game_content.evidence_clue_links (evidence_id);

alter table game_content.evidence_clue_links enable row level security;

create table if not exists game_content.clue_suspect_impacts (
  id uuid primary key default gen_random_uuid(),
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  impact_type text not null check (impact_type in (
    'SUPPORTS_GUILT', 'WEAKENS_ALIBI', 'PROVES_MOTIVE',
    'PROVES_OPPORTUNITY', 'PROVES_METHOD', 'EXCLUDES',
    'EXPLAINS_LIE', 'RED_HERRING'
  )),
  weight smallint not null default 50 check (weight between -100 and 100),
  explanation text not null check (char_length(btrim(explanation)) > 0),
  created_at timestamptz not null default now(),
  unique (clue_id, suspect_id, impact_type)
);

comment on table game_content.clue_suspect_impacts is
  'SERVER CONTENT: structured effect of each clue on each suspect for deduction and ending evaluation.';

create index if not exists clue_suspect_impacts_clue_idx
  on game_content.clue_suspect_impacts (clue_id);
create index if not exists clue_suspect_impacts_suspect_idx
  on game_content.clue_suspect_impacts (suspect_id);

alter table game_content.clue_suspect_impacts enable row level security;

alter table game_content.clue_unlock_conditions
  drop constraint if exists clue_unlock_conditions_condition_type_check;

alter table game_content.clue_unlock_conditions
  add constraint clue_unlock_conditions_condition_type_check
  check (condition_type in (
    'EVIDENCE_VIEWED', 'EVIDENCE_PRESENTED',
    'QUESTION_TYPE_ASKED', 'SUSPECT_INTERROGATED',
    'FACT_USED', 'FACT_REVEALED', 'CLAIM_RECORDED',
    'CLUE_ACQUIRED'
  ));

create index if not exists clue_unlock_conditions_clue_group_idx
  on game_content.clue_unlock_conditions (clue_id, group_no, condition_order);
