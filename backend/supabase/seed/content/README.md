# Episode content seed specifications

The built-in seed content for `GS-01`, `JL-01`, `CC-01`, and `JJ-01` is maintained in `src/seeds/four-episode-content.ts`, based on the four approved regional scenario PDFs.
Reviewed JSON documents placed here override the built-in document set.

The seed runner validates all four episodes before writing any database rows. Seed-only reference fields start with `_` and are removed before upsert:

- `_culprit_suspect_id` on an episode
- `_is_core` on a clue
- `_target_clue_id`, `_target_evidence_id`, `_target_suspect_id` on a clue condition
- `_target_suspect_id` on an ending
- `_episode_id` and `_related_clue_id` on a dialect expression

Every non-code table row must have a stable UUID `id`. Code tables are upserted by `code`; all other tables are upserted by `id`.
