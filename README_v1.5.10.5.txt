AlphaDog/OXYGEN-COBALT Scheduled Backend
v1.5.10.5 - Incremental Locked Continuation Gate

Patch target:
- Fixes the cron/orchestrator bridge regression where Incremental Daily could start, schedule/advance its child incremental_temp_refresh_runs row, then leave the parent GLOBAL lane locked.

Root cause fixed:
- run_incremental_temp_refresh_auto can return auto_continue_scheduled / partial continuation.
- The parent queue row became running and GLOBAL stayed locked to incremental_daily.
- On the next cron tick, the locked-job continuation allowlist did not include incremental_daily.
- The orchestrator therefore returned single_lane_busy instead of re-entering the incremental runner.
- Result: child incremental row stayed running, temp tables stayed empty, and downstream/cascades never advanced.

Surgical change:
- Added incremental_daily to the locked continuation allowlist inside runRefreshOrchestratorTick.
- Preserved the existing partial-release behavior after the incremental runner returns.
- Did not change real data tables, scoring math, candidate board logic, odds logic, PrizePicks logic, or UI layout.

Expected behavior after deploy:
- Manual selected Incremental Daily should be picked up by the minute cron.
- If the first tick returns auto_continue_scheduled, the next cron tick should continue incremental_daily instead of returning single_lane_busy forever.
- Queue row should eventually move from running/pending to completed or failed with output_json.
- incremental_temp_refresh_runs should advance beyond stage_delta_logs if source data is available and no source/API error occurs.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Go to DATA REFRESHING > PRODUCTION CLOCK ORCHESTRATOR.
4. Run Killer Cleaner first.
5. Confirm Production Clock Status shows all schedule plans disabled and active_queue empty.
6. Select only 01 Incremental Daily Delta.
7. Click Schedule Selected Only.
8. Wait for cron ticks and check with the SQL below.

SQL checks:
SELECT request_id, chain_id, job_key, sequence_order, status, tick_count, run_after, started_at, finished_at, updated_at, error, substr(output_json,1,2200) AS output_preview
FROM data_refresh_queue
WHERE created_at >= datetime('now','-20 minutes')
ORDER BY datetime(created_at) DESC, sequence_order ASC
LIMIT 50;

SELECT request_id, status, run_after, current_step, created_at, started_at, finished_at, updated_at, error, substr(output_json,1,2200) AS output_preview
FROM incremental_temp_refresh_runs
ORDER BY datetime(created_at) DESC
LIMIT 5;

SELECT state_key, lock_flag, running_job_key, running_request_id, running_chain_id, status, started_at, updated_at, last_error, substr(state_json,1,2500) AS state_preview
FROM data_orchestrator_state
WHERE state_key = 'GLOBAL';
