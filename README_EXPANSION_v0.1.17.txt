AlphaDog Expansion Worker
v0.1.17 - Schema Semicolon Guard

Purpose:
- Fixes the v0.1.15 context-build schema drift by resetting isolated Phase 1 read-model tables before rebuilding context.
- Keeps the read-only Phase 1 score audit lens before score sharpening.
- Preserves isolated expansion universe: reads prepared production data, writes only xp_* tables.
- Does not mutate production scoring tables, candidate board tables, Main UI, or scheduled backend logic.

New/continued routes:
- /xp/bridge/build
- /xp/bridge/counts
- /xp/bridge/unmatched
- /xp/context/build
- /xp/context/counts
- /xp/context/completeness
- /xp/context/sample
- /xp/score/build
- /xp/score/counts
- /xp/score/sample
- /xp/score/audit

Score audit lens:
- /xp/score/audit exposes internal_score_0_100 plus component fields and formula_json.
- Market/odds are explicitly NOT USED in Phase 1.
- Goblin/demon rows remain visible-side line variants only; no unders are created.

Exact test order:
1. Open AlphaDog Expansion Control Room.
2. Group: top system buttons → Apply Schema.
3. Group: top system buttons → Refresh Board.
4. Group: Phase 1 Pipeline → Build Bridge.
5. Group: Phase 1 Pipeline → Bridge Counts.
6. Group: Phase 1 Pipeline → Unmatched.
7. Group: Phase 1 Pipeline → Build Context.
8. Group: Phase 1 Pipeline → Context Counts.
9. Group: Phase 1 Pipeline → Completeness.
10. Group: Phase 1 Pipeline → Build Score.
11. Group: Phase 1 Pipeline → Score Counts.
12. Group: Phase 1 Pipeline → Score Audit.

Expected:
- Bridge should keep one row per xp_line_key.
- Context should preserve missing metrics/lineup/starter as warnings/nulls, not fake zeroes.
- Score Audit should show component breakdown and formula_json for review before any score sharpening.
