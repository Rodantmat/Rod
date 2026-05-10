AlphaDog/OXYGEN-COBALT Production Scheduled Backend
Version: v1.5.05.1 - True Incremental Selector Gate

Purpose
- Fixes the real root cause after v1.5.05.0: daily incremental was allowed to fall back into a near-full all-player rebuild.
- Preserves the live incremental base.
- Converts accidental active full-safe daily incremental temp runs into true finalized-game delta mode when the live base is usable.

What changed
1. Daily incremental selector now treats the live base as usable for true delta when:
   - player_game_logs has at least 9000 rows,
   - incremental_player_metrics has at least 700 rows,
   - player_game_logs has a latest game date.
2. ref_player_splits count no longer forces daily incremental into full-safe rebuild. Splits are not required for the finalized-game delta selector.
3. Full rebuild is now reserved for explicit force_full_incremental requests or truly unusable base state.
4. Active accidental stage_logs/stage_splits full-safe runs are converted to stage_delta_logs, temp tables are reset, live tables are untouched, and delta proceeds from finalized games only.
5. Heartbeat stale recovery from v1.5.05.0 is preserved.

Expected behavior
- Daily incremental should process finalized games, not 778 players.
- selected_players_total should no longer appear as the normal daily path.
- Normal progress should show refresh_mode=delta, attempted_games, progress_done, and remaining_games_after.

Test sequence
1. DATA REFRESHING > Orchestrator Status
2. Confirm version: v1.5.05.1 - True Incremental Selector Gate
3. Run MANUAL SQL:
   SELECT request_id,status,current_step,updated_at,substr(output_json,1,1200) AS output_preview,error FROM incremental_temp_refresh_runs ORDER BY created_at DESC LIMIT 3;
4. Wait for one minute-cron tick, then run DATA REFRESHING > Orchestrator Status again.
5. Expected: incremental current output mentions true delta / stage_delta_logs / attempted_games, not selected_players_total=778.

Do not run force_full_incremental unless intentionally rebuilding the base.
