AlphaDog / OXYGEN-COBALT
v1.5.10.19 - Everyday Phase 1 Parent Child Fuse Gate

Purpose
- Fixes Everyday Phase 1 parent/child binding after v1.5.10.18.
- Parent data_refresh_queue.request_id must equal everyday_phase1_runs.request_id for queue-owned Everyday Phase 1.
- Stale same-slate active child rows are cancelled instead of being resumed.
- A queue-owned Everyday Phase 1 run cannot silently attach to an older child row by slate_date alone.
- Preserves the locked incremental delta logic.

Key fixes
1. Bound child creation
   - scheduleEverydayPhase1Once now detects queue_request_id from orchestrator input.
   - For queue-owned runs, it creates or reuses everyday_phase1_runs using that exact parent request_id.

2. Stale child cancellation
   - Pending/running everyday_phase1_runs rows for the same slate but a different request_id are cancelled before the bound child starts.

3. Bound tick selection
   - runEverydayPhase1Tick now selects by bound queue_request_id when called by the orchestrator.
   - It refuses a parent/child mismatch instead of running a stale child.

4. Safety
   - Completed bound children are read as completed and checked.
   - Cancelled/failed bound children can be reopened only for the same parent request.
   - Manual/non-orchestrator Phase 1 behavior remains compatible.

Test sequence
1. Deploy this ZIP.
2. In Control Room, run: DATA REFRESHING > Killer Cleaner.
3. Run: DATA REFRESHING > Schedule Selected Only, selecting only 02 Everyday Phase 1.
4. After 2-3 minutes, run Manual SQL:

SELECT
  q.request_id AS queue_request_id,
  q.status AS queue_status,
  q.tick_count,
  q.run_after,
  q.started_at,
  q.finished_at,
  q.updated_at,
  q.error,
  r.request_id AS child_request_id,
  r.status AS child_status,
  r.current_step,
  r.started_at AS child_started_at,
  r.finished_at AS child_finished_at,
  r.updated_at AS child_updated_at,
  r.error AS child_error
FROM data_refresh_queue q
LEFT JOIN everyday_phase1_runs r ON r.request_id = q.request_id
WHERE q.job_key = 'everyday_phase1'
ORDER BY datetime(q.created_at) DESC
LIMIT 5;

Expected:
- queue_request_id equals child_request_id for the active/latest run.
- No new queue row should run with no matching child row.
- partial_continue should remain pending with a future run_after, not failed.
- completed is allowed only when the matching child is completed/current_step completed.

5. Cleanliness SQL after completion:

SELECT COUNT(*) AS active_queue_rows
FROM data_refresh_queue
WHERE status IN ('pending','running','requested');

SELECT state_key, lock_flag, running_job_key, running_request_id, running_chain_id, status, updated_at, last_error
FROM data_orchestrator_state;

SELECT job_key, run_requested_flag, running_flag, blocked_flag, current_request_id, current_chain_id, last_status, last_error_code, last_error_message, updated_at
FROM data_orchestrator_jobs
WHERE run_requested_flag = 1 OR running_flag = 1 OR blocked_flag = 1
ORDER BY job_index;
