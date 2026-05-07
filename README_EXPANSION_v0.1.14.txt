AlphaDog Expansion Worker
v0.1.14 - Phase 1 Internal Score Scaffold

Scope:
- Isolated expansion worker/control room only.
- Reads existing prepared production tables and isolated xp_* read models.
- Writes only xp_* tables.
- Does not mutate production scoring tables, production backend logic, or Main UI.

Adds:
- xp_phase1_score_current.
- Build Score button.
- Score Counts button.
- Score Sample button.

Important:
- Score is internal-only Phase 1 context score for Hitter Strikeouts and Walks.
- It is not a final betting score.
- It does not include external market/odds.
- It does not create unders for goblin/demon lines.
- Non-standard line variants are preserved as independent rows with warning/cap metadata.

Deploy files:
- alphadog_expansion_worker.js
- alphadog_expansion_control_room.html
- alphadog_expansion_schema.sql
- wrangler.expansion.jsonc
- package.expansion.json
