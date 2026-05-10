AlphaDog Production Scheduled Backend Patch
Version: v1.5.05.4 - Lock Hygiene Catchup Stabilizer

Purpose:
Stabilize the full incremental_daily orchestration flow after the multi-day catchup repair: released locks must not block reruns, temp tables must never disappear during certification/status checks, and the true-delta catchup must remain multi-day.

What changed:
- Keeps the daily incremental job in strict true-delta mode only.
- Cleans temp tables before scheduling a new incremental run.
- Reads the live incremental base max game date from player_game_logs / incremental_player_metrics.
- Builds one catchup window covering every finalized game date greater than the live base max date through the latest safe finalized date.
- Blocks accidental all-player/full-base rebuilds unless force_full_incremental is explicitly requested.
- Prevents stage_delta_logs from advancing to audit just because temp rows are non-zero or cron/auto_continue is active.
- Advances to audit only when every finalized game in the missing-date window has terminal progress.
- Promotion remains INSERT OR REPLACE, followed by clean, derived rebuild, and live certification.
- Reclaims released enqueue locks instead of treating them as active duplicates.
- Purges terminal released locks during cleanup so completed/cancelled queue rows do not poison future selected runs.
- Temp cleanup now keeps table shells alive and deletes rows, avoiding the no-table window that caused ref_player_splits_temp errors.

Expected behavior after deploy:
If the live base is current through 2026-05-07 and finalized games exist for 2026-05-08, 2026-05-09, and 2026-05-10, one incremental_daily request should continue staging all finalized games across those dates before audit/promote. No manual day-by-day runs.

Test sequence:
1. Deploy this ZIP to the production scheduled backend Worker only.
2. Open Control Room.
3. Confirm visible version: v1.5.05.4 - Lock Hygiene Catchup Stabilizer.
4. Go to DATA REFRESHING.
5. Click Orchestrator Status. Confirm GLOBAL lock is clear and incremental_daily is not running from the cancelled bad run. Also confirm there is no duplicate block caused by a released enqueue lock.
6. In DATA REFRESHING, select only 01 Incremental Daily Delta.
7. Click Schedule Selected Only.
8. Wait for the minute cron to pick it up.
9. Run Manual SQL diagnostics:

SELECT request_id, status, current_step, started_at, finished_at, updated_at, substr(output_json,1,1800) AS output_preview, error FROM incremental_temp_refresh_runs ORDER BY created_at DESC LIMIT 3;

SELECT COUNT(*) AS temp_logs_total, COUNT(DISTINCT player_id) AS temp_players, MIN(game_date) AS temp_oldest_game_date, MAX(game_date) AS temp_newest_game_date FROM player_game_logs_temp;

SELECT COUNT(*) AS live_logs_total, COUNT(DISTINCT player_id) AS live_players, MIN(game_date) AS live_oldest_game_date, MAX(game_date) AS live_newest_game_date FROM player_game_logs;

SELECT COUNT(*) AS metrics_total, COUNT(DISTINCT player_id) AS metric_players, MIN(first_game_date) AS oldest_first_game_date, MAX(last_game_date) AS newest_last_game_date, MAX(updated_at) AS newest_metric_update FROM incremental_player_metrics;

SELECT lock_key, request_id, job_key, slate_date, mode, status, created_at, updated_at FROM data_orchestrator_enqueue_locks WHERE job_key = 'incremental_daily' ORDER BY datetime(updated_at) DESC LIMIT 10;

Pass condition:
- The latest run uses stage_delta_logs first.
- output_json shows mode delta and a multi-day catchup window.
- It does not advance to audit while remaining_games > 0.
- After completion, live max game date moves forward through all finalized missing dates staged in that run.
- player_game_logs_temp is cleaned after successful promote.
- player_game_logs_temp and ref_player_splits_temp both still exist after clean with zero rows.
- A released lock never blocks a new selected incremental_daily run.
