AlphaDog / OXYGEN-COBALT Build

v1.5.10.20 - Everyday Phase 1 Lineups Bounded Certification Gate

Purpose
- Fixes the Everyday Phase 1 lineups hang from the prior build.
- Keeps the incremental delta logic locked and untouched.
- Converts MLB lineup mining into a bounded, resumable, certification-sensitive child step.

What changed
- `scrape_lineups_mlb_api` no longer attempts to fetch every slate game in one cron tick.
- It fetches only missing current pickable/unstarted games, capped to a small batch per tick.
- Started/expired games are not allowed to block Phase 1 forever.
- The lineups step now certifies against current pickable slate teams before advancing.
- If lineup rows are written but the step is not certified yet, the next tick resumes only missing teams.
- `lineups` joins the same certification-sensitive pattern already used for usage and candidate steps.
- A clean success now requires real certified output, not just a non-crashing child result.

Expected behavior
- Everyday Phase 1 may show `partial_continue` while lineups are incomplete.
- It should not hang with the child stuck on `lineups` while `lineups_current` keeps changing.
- It should complete once current pickable slate lineup coverage certifies, or if no pickable games remain.

Exact test sequence
1. DATA REFRESHING > Killer Cleaner
2. DATA REFRESHING > Schedule Selected Only
   - Select only: 02 Everyday Phase 1
3. Wait for minute cron ticks.
4. MANUAL SQL > Output, run:

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
  r.error AS child_error,
  substr(r.output_preview,1,12000) AS child_output_preview
FROM data_refresh_queue q
LEFT JOIN everyday_phase1_runs r ON r.request_id = q.request_id
WHERE q.job_key = 'everyday_phase1'
ORDER BY datetime(q.created_at) DESC
LIMIT 5;

5. Confirm lineups either advances, or remains `partial_continue` with a clear lineup certification/missing-teams payload.
6. After completion, verify cleanup:

SELECT COUNT(*) AS active_queue_rows
FROM data_refresh_queue
WHERE status IN ('pending','running','requested');

SELECT
  state_key, lock_flag, running_job_key, running_request_id,
  running_chain_id, status, updated_at, last_error
FROM data_orchestrator_state;

SELECT
  job_key, run_requested_flag, running_flag, blocked_flag,
  current_request_id, current_chain_id, last_status,
  last_error_code, last_error_message, updated_at
FROM data_orchestrator_jobs
WHERE run_requested_flag = 1
   OR running_flag = 1
   OR blocked_flag = 1
ORDER BY job_index;
