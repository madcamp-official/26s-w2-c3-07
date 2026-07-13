alter table game_content.suspects
  add constraint suspects_code_key unique (code);

alter table game_content.evidence
  add constraint evidence_code_key unique (code);

alter table game_content.clues
  add constraint clues_code_key unique (code);

alter table game_content.dialect_expressions
  add constraint dialect_expressions_code_key unique (code);

alter table game_content.endings
  add constraint endings_code_key unique (code);
