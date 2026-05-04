AlphaDog / OXYGEN-COBALT
v1.3.72 - Incremental Daily Delta Runner Repair

Purpose:
- Surgical incremental-data repair only.
- Fixes the daily incremental pipeline so pending incremental temp refresh requests are consumed by the minute cron.
- Fixes the daily incremental temp stage so it fetches fresh current-season MLB StatsAPI game logs/splits into temp instead of copying stale live rows back into temp.

Root cause confirmed before patch:
- incremental_temp_refresh_runs had a pending request stuck at stage_logs.
- started_at was null after run_after had already passed.
- player_game_logs latest game_date was stuck at 2026-04-28.
- player_game_logs_temp and ref_player_splits_temp were empty.
- pipeline_locks were IDLE.
- task_runs showed no recent run_incremental_temp_refresh_tick after Apr 29.

Changes:
1. Minute cron now advances due incremental temp work:
   - After admin/full-refresh and static checks, the * * * * * cron runs run_incremental_temp_refresh_tick when an incremental temp request is due.
   - The cron returns incremental_refresh_minute_scheduler when it advances that pipeline.

2. Admin/Main UI full refresh no longer skips incremental incorrectly:
   - The incremental step no longer treats idle_no_due_temp_refresh as complete immediately after scheduling a pending request.
   - It keeps the admin freshness flow on incremental_daily until the incremental pipeline reaches refresh_complete/completed.

3. stage_logs was repaired:
   - player_game_logs_temp is now filled from fresh MLB StatsAPI current-season gameLog calls in bounded batches.
   - It no longer copies stale player_game_logs into temp.
   - Progress is tracked with static_scrape_progress domain incremental_temp_game_logs.

4. stage_splits was repaired:
   - ref_player_splits_temp is now filled from fresh MLB StatsAPI statSplits calls with sitCodes=vl,vr in bounded batches.
   - It no longer copies stale ref_player_splits into temp.
   - Progress is tracked with static_scrape_progress domain incremental_temp_splits.

5. Long pipeline safety preserved:
   - Temp tables are reset when schedule_incremental_temp_refresh_once creates a new request.
   - Progress domains are reset for the new season/request.
   - Each tick processes a bounded batch, then remains on the same step when more players remain.
   - Audit/promotion/clean/derived final-state logic remains protected.

Preserved:
- Scoring math untouched.
- HITS/TOTAL_BASES strategic probability lift untouched.
- RBI Gemini signal logic untouched.
- PrizePicks/Sleeper ingest untouched.
- Odds API logic untouched.
- Static weekly temp pipeline untouched.
- D1 schema shape preserved; no destructive live table wipe added.

Expected test behavior:
- Schedule Daily Temp Test should create a pending request.
- Minute cron or Run Temp Tick should start stage_logs and fill player_game_logs_temp in batches.
- stage_logs repeats until all active players are processed.
- stage_splits repeats until all active players are processed.
- Audit promotes only if certification passes.
- Clean returns temp tables to 0 after success.
- Derived rebuild updates incremental_player_metrics.
- Final player_game_logs max(game_date) should advance beyond 2026-04-28 once MLB StatsAPI has newer completed game logs available.

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.72.txt
- BUILD_VERSION_AUDIT_v1.3.72.txt
