AlphaDog/OXYGEN-COBALT v1.5.10.2 - Everyday Retry-Later Release Gate

Purpose:
- Fixes the Everyday Phase 1 retry_later trap where a child run could return no_confirmed_lineups_yet / retry_later and leave the production cascade stuck in RUNNING_WAITING_CHECK.
- Keeps the existing one-shot/direct pickup rescue path and adds the retry-later release gate.
- Expands Killer Cleaner so it deletes stale temporary one-shot full-run plans in addition to queue rows, job flags, locks, task rows, deferred rows, and pipeline locks.

Core fix:
- Queue-owned everyday_phase1_all_direct still uses bounded one-step ticks.
- If a child step returns retry_later=true, the child everyday_phase1_runs row is finalized as completed with non_blocking_retry_later evidence.
- The parent orchestrator marks Everyday Phase 1 as completed_retry_later_released instead of partial_continue.
- GLOBAL is released and downstream jobs can continue.
- No scoring tables, PrizePicks rows, odds rows, or release board rows are wiped.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Go to DATA REFRESHING.
4. Click Killer Cleaner once.
5. Click Production Clock Status and confirm there are no active queue rows and old one_shot_full_run plans are gone.
6. Click Schedule One-Shot Full Run +2 Min.
7. Wait for cron pickup.
8. Run Manual SQL:
   SELECT request_id, chain_id, job_key, sequence_order, status, tick_count, run_after, started_at, finished_at, updated_at, error, substr(output_json,1,1200) AS output_preview
   FROM data_refresh_queue
   WHERE created_at >= datetime('now','-30 minutes')
   ORDER BY datetime(created_at) DESC, sequence_order ASC
   LIMIT 80;
9. Expected: Everyday Phase 1 should not sit forever in RUNNING_WAITING_CHECK when lineups are not posted. It should finish as completed/completed_retry_later_released and downstream rows should start advancing.
