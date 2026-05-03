AlphaDog Main UI v1.0.16 - Candidate Board Rankless Query Repair

Fixes the Main UI board endpoint still falling back to stale export task rows because the direct score_candidate_board query ordered by candidate_rank/rank columns that are not guaranteed to exist.

Changes:
- Direct board query now orders by final_score DESC, player_name ASC.
- Keeps score_candidate_board as primary read model.
- Keeps backend release trusted: no browser-side start-time double gate.
- Keeps DEFERRED_UNPICKABLE hidden from primary board.
- Keeps standard/regular line-type mapping.
- Leaves scheduled backend/control room untouched.

Expected /main_alphadog_board?score_min=0 result after deploy:
- rows_count: 38 for the current 2026-05-03 board if backend data remains as tested.
- export_fallback_used: false.
- prop_counts.RBI: 38.
