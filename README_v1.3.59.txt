AlphaDog Control Room Build
v1.3.59 - Minute Cron Full Refresh Scheduler

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.59.txt

Deployment target:
- Control room / scheduled backend worker: prop-ingestion-git
- Do not deploy this ZIP to the Main UI worker.

Surgical fixes in this build:
1. Keeps the Wrangler cron list to exactly one cron: * * * * *.
2. Adds minute-cron scheduling for Admin/Main UI full refresh at:
   - 9:00 AM Pacific time
   - 12:00 PM Pacific time
   - 9:00 PM Pacific time
3. The three scheduled full refreshes use the same backend-safe deferred Admin freshness dispatcher as the Main UI button.
4. Manual Main UI/Admin Refresh Full Data still works anytime. The button creates a deferred request, then the minute cron advances it in backend steps.
5. If no button request, no scheduled refresh slot, and no weekly static work is due, the minute cron exits idle without heavy work.
6. Weekly static-temp refresh is scheduled from the minute cron on Monday 1:00 AM Pacific time, then advanced by the same minute cron until complete.
7. The minute cron no longer starts the old Phase 3 fallback/daily cron work when no Admin refresh is due.
8. PrizePicks GitHub board refresh remains in the full refresh sequence before Phase 2C and scoring.
9. Static remains excluded from the daily/manual full refresh sequence, except for the separate weekly static-temp refresh.

Expected Worker Health:
- version: v1.3.59 - Minute Cron Full Refresh Scheduler
- worker: alphadog-phase3-starter-groups
- db_bound: true
- ingest_token_bound: true
- gemini_key_bound: true
- prompt_base_url_bound: true

Test sequence after deploy:
1. Cloudflare deploy the ZIP to prop-ingestion-git.
2. Open Control Room.
3. Run group: DEBUG. Button: Health.
4. Confirm version = v1.3.59 - Minute Cron Full Refresh Scheduler.
5. From Main UI Admin, click Refresh Full Data once.
6. Wait 2 minutes.
7. In Control Room, run MANUAL SQL:

SELECT
  request_id,
  job_name,
  slate_date,
  status,
  requested_at,
  run_after,
  started_at,
  finished_at,
  requested_by,
  error,
  substr(output_json,1,1200) AS output_preview
FROM deferred_full_run_once
ORDER BY requested_at DESC
LIMIT 10;

8. Confirm the manual request is moving through admin_refresh_state.
9. Run MANUAL SQL:

SELECT
  job_name,
  status,
  started_at,
  finished_at,
  error,
  substr(output_json,1,1200) AS output_preview
FROM task_runs
WHERE job_name='admin_freshness_dispatcher_step'
ORDER BY started_at DESC
LIMIT 20;

10. Confirm steps are advancing.
11. To verify the minute cron is not doing heavy work when idle, run MANUAL SQL:

SELECT
  job_name,
  status,
  started_at,
  finished_at,
  substr(output_json,1,900) AS output_preview
FROM task_runs
WHERE job_name IN ('admin_freshness_dispatcher_step','run_static_temp_refresh_tick')
ORDER BY started_at DESC
LIMIT 30;

Notes:
- The scheduled 9AM/12PM/9PM PT jobs are created by worker.js at the matching Pacific minute, not by separate Wrangler crons.
- The one-minute cron is only a dispatcher/poller. It does not run the full refresh every minute.
- The weekly static refresh is Monday 1:00 AM PT.
