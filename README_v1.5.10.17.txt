AlphaDog / OXYGEN-COBALT scheduled backend build
v1.5.10.17 - Everyday Phase 1 Certification Delta Gate

Purpose
- Keep incremental delta locked. No incremental delta logic was intentionally changed.
- Patch Everyday Phase 1 so certification-sensitive child steps cannot create fake clean success.
- Apply the same incremental-delta rule to Phase 1 usage and candidate-prep steps: bounded progress may continue, but incomplete/mined-partial output must keep the queue open until certified.

Main changes
1. Everyday Phase 1 no longer releases retry_later/degraded child results as completed success.
2. Usage now has a slate certification gate against current pickable lineup rows and player_recent_usage rows updated for the current run/day.
3. Usage timeout/degraded/data_ok=false now holds the current usage step and returns partial_continue_not_certified.
4. Candidate steps for Hits/RBI/RFI now require real output for an active slate before advancing.
5. Queue result data_ok is false while Phase 1 is partial, so downstream cascade stages do not treat partial work as clean completion.
6. check_everyday_phase1 now includes usage_certification and fails when usage is not certified after the usage/candidate/completed portion of the run.

Test sequence
1. Deploy this build.
2. In Control Room, select only: 02 Everyday Phase 1.
3. Click: DATA REFRESHING > Schedule Selected Only.
4. Wait for minute cron.
5. Run Manual SQL #1:

SELECT
  request_id, chain_id, job_key, status, tick_count, run_after,
  created_at, started_at, finished_at, updated_at, error,
  substr(output_json,1,8000) AS output_preview
FROM data_refresh_queue
WHERE job_key = 'everyday_phase1'
ORDER BY datetime(created_at) DESC
LIMIT 5;

6. Run Manual SQL #2:

SELECT
  request_id, slate_date, status, current_step,
  created_at, started_at, finished_at, updated_at, error,
  substr(output_preview,1,12000) AS output_preview
FROM everyday_phase1_runs
ORDER BY datetime(created_at) DESC
LIMIT 5;

7. Run Manual SQL #3:

SELECT
  COUNT(*) AS active_queue_rows
FROM data_refresh_queue
WHERE status IN ('pending','running','requested');

Expected behavior
- If Usage is incomplete/degraded/timed out, queue remains pending and current_step remains usage.
- It must not say completed clean until usage and candidate steps certify.
- When complete, queue should close, GLOBAL should return IDLE, and no active job flags/locks should remain.
