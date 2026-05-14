AlphaDog v1.5.10.16 - Everyday Phase 1 Child Binding Gate

Patch purpose:
- Keeps Incremental Daily Delta locked/stable from v1.5.10.14/v1.5.10.15 behavior.
- Fixes Everyday Phase 1 queue/child mismatch by binding the child everyday_phase1_runs request_id to the parent data_refresh_queue request_id when run through the orchestrator.
- Adds bounded child-step protection so Everyday Phase 1 cannot strand GLOBAL in RUNNING_WAITING_CHECK when a child step, especially lineups, runs too long.
- Treats unavailable/slow lineup collection as degraded/non-blocking and advances the child run to the next Phase 1 step instead of completing the whole phase early or hanging the queue.
- Preserves existing UI and stable flows. No scoring math, candidate-board math, incremental logic, or protected real-data tables were intentionally changed.

Exact test sequence:
1. DATA REFRESHING > Killer Cleaner.
2. DATA REFRESHING > Schedule Selected Only: select 02 Everyday Phase 1 only.
3. Wait one cron cycle, then run Manual SQL checks:

SELECT request_id, chain_id, job_key, status, tick_count, run_after, created_at, started_at, finished_at, updated_at, error, substr(output_json,1,8000) AS output_preview
FROM data_refresh_queue
WHERE job_key = 'everyday_phase1'
ORDER BY datetime(created_at) DESC
LIMIT 5;

SELECT request_id, slate_date, status, current_step, created_at, started_at, finished_at, updated_at, error, substr(output_preview,1,8000) AS output_preview
FROM everyday_phase1_runs
ORDER BY datetime(created_at) DESC
LIMIT 10;

SELECT state_key, lock_flag, running_job_key, running_request_id, running_chain_id, status, updated_at, last_error
FROM data_orchestrator_state;

Expected:
- Parent queue request_id and active everyday_phase1_runs request_id should match for the new run.
- Queue should either complete or return pending partial_continue between ticks, not remain permanently running with stale RUNNING_WAITING_CHECK.
- If lineups are unavailable/slow, output should show partial_continue_lineups_degraded and continue to usage/candidates on later ticks.
