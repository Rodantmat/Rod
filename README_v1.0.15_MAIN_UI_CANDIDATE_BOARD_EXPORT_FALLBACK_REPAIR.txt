v1.0.15 - Candidate Board Export Fallback Repair

Surgical Main UI repair.

Changes:
- Board endpoint no longer SQL-filters prop_family/final_score before hydration.
- Board endpoint trusts backend release rows and removes browser start-time double gate.
- Adds export task fallback: if direct score_candidate_board read returns zero, it reads latest export_mlb_score_candidate_board_v1 output_json from task_runs.
- Adds diagnostics fields to /main_alphadog_board and /main_alphadog_board_debug.
- Client Board/RBI filters trust backend candidate release rows instead of re-locking by start time.
- Admin Incremental Daily checks task_runs, incremental_temp_refresh_runs, and incremental_player_metrics freshness; no fake date is created.

Untouched:
- Scheduled backend/control room.
- Cron.
- Scoring math.
- Candidate board builder/pickability logic.
- D1 schema.
