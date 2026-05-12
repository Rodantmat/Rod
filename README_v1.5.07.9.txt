AlphaDog v1.5.07.9 - PrizePicks Dispatch Seed Gate

Surgical patch over v1.5.07.8.

What changed:
- Preserved the One-Shot Full Run button and schedule-plan behavior from v1.5.07.7 / v1.5.07.8.
- Preserved the normal Production Clock schedule path. No manual tick requirement was added.
- Added a hard PrizePicks dispatch seed before GitHub workflow_dispatch.
- The worker now inserts a prizepicks_scraper_runs tracking row for the queue request_id before the GitHub scrape starts.
- The worker also seeds again immediately before workflow_dispatch as a second guard.
- Existing completed/failed scraper rows are not overwritten by the seed.
- PrizePicks Board dynamic timeout now terminally fails the board stage instead of requeueing/restarting the same board job forever.
- Downstream PrizePicks Context / Odds / Scoring rows are blocked if PrizePicks Board terminally fails.

Root issue addressed:
- v1.5.07.8 could dispatch/wait for PrizePicks Board while no matching prizepicks_scraper_runs row existed for the current request_id.
- The old recovery path then timed out and requeued the board row, causing repeated waiting/restart behavior instead of a clean terminal result.

Exact test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Do not click Run Queue Tick.
4. In DATA REFRESHING • PRODUCTION CLOCK ORCHESTRATOR, click Create One-Shot Full Run +5 Min.
5. Confirm output status is one_shot_full_backend_run_scheduled and note the plan_key / due_pt.
6. Wait at least 6 minutes.
7. Run Manual SQL:

SELECT
  chain_id,
  request_id,
  job_key,
  display_name,
  sequence_order,
  status,
  tick_count,
  created_at,
  started_at,
  finished_at,
  updated_at,
  error,
  substr(output_json,1,2200) AS output_preview
FROM data_refresh_queue
WHERE chain_id = (
  SELECT chain_id
  FROM data_refresh_queue
  WHERE created_at >= datetime('now','-30 minutes')
  ORDER BY datetime(created_at) DESC
  LIMIT 1
)
ORDER BY sequence_order;

8. When PrizePicks Board starts/runs, run:

SELECT
  run_id,
  dispatch_id,
  status,
  step,
  progress_message,
  started_at,
  finished_at,
  rows_main,
  error_message,
  source,
  script_version,
  updated_at
FROM prizepicks_scraper_runs
ORDER BY datetime(updated_at) DESC
LIMIT 10;

Passing behavior:
- A row appears in prizepicks_scraper_runs for the active PrizePicks Board request_id before the scrape finishes.
- If GitHub/main.py reports completion, PrizePicks Board completes and downstream stages continue.
- If no scraper/audit result arrives by the dynamic timeout, PrizePicks Board fails cleanly and does not requeue forever.
