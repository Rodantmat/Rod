AlphaDog v1.5.05.0 - Incremental Heartbeat Recovery Gate

Patch target:
- Production scheduled backend / Control Room only.
- Fixes stale incremental_daily recovery using the real child heartbeat in incremental_temp_refresh_runs.updated_at.

What changed:
1. The stale cleanser now inspects incremental_temp_refresh_runs as the source-of-truth heartbeat for incremental_daily.
2. If GLOBAL + data_refresh_queue are stuck and the child temp run has no heartbeat beyond the safe heartbeat window, the old queue row is closed as stale_recovered.
3. Staged incremental temp data is preserved. No wipe, no promote, no certification, no restart-from-zero.
4. A clean continuation queue request is created and data_orchestrator_jobs.current_request_id is moved to that continuation.
5. GLOBAL lock is released and incremental_daily.running_flag is cleared.
6. Runtime profile sampling no longer references a nonexistent data_refresh_queue.last_processed_at column.
7. Incremental partial ticks preserve started_at and use resume logging instead of repeated fresh-start logging.

Exact test sequence:
1. Deploy this ZIP to the production scheduled backend worker.
2. Open Control Room.
3. Go to DATA REFRESHING.
4. Click Orchestrator Status once and confirm version shows v1.5.05.0 - Incremental Heartbeat Recovery Gate.
5. Click Run One Queue Tick once.
6. Click Orchestrator Status again.
7. Expected for the current stuck case:
   - GLOBAL lock_flag should become 0 briefly or move to the new continuation request on the next tick.
   - Old request 81929549-0d33-45b9-a6f1-215168fb9655 should no longer be status running.
   - Old request should show stale_recovered.
   - A new incremental_daily queue request should exist as pending/running.
   - incremental_temp_refresh_runs request f6dfa2b7-f361-4e2a-8757-4bbc91a47ae9 should remain preserved and due/pending/running, not deleted.
   - Logs should include stale_incremental_daily_heartbeat_recovered once.

Focused verification SQL after one tick:

SELECT state_key, lock_flag, running_job_key, running_request_id, status, updated_at, state_json
FROM data_orchestrator_state
WHERE state_key='GLOBAL';

SELECT request_id, job_key, status, error, started_at, finished_at, updated_at
FROM data_refresh_queue
WHERE request_id='81929549-0d33-45b9-a6f1-215168fb9655'
   OR job_key='incremental_daily'
ORDER BY datetime(created_at) DESC
LIMIT 10;

SELECT request_id, status, current_step, run_after, started_at, finished_at, updated_at, error
FROM incremental_temp_refresh_runs
ORDER BY datetime(created_at) DESC
LIMIT 5;

SELECT created_at, job_key, event_type, status, error_code, message
FROM data_orchestrator_logs
WHERE event_type LIKE '%incremental%heartbeat%'
ORDER BY datetime(created_at) DESC
LIMIT 10;
