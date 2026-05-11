AlphaDog/OXYGEN-COBALT Production Scheduled Backend
v1.5.06.3 - PrizePicks Idempotent Dispatch Latch

Purpose:
- Fixes PrizePicks GitHub workflow_dispatch re-triggering during repeated minute-cron wait ticks.
- Each PrizePicks board queue request_id is now latched to one dispatch_id.
- If prizepicks_scraper_runs already has a row for that dispatch_id, later cron ticks poll progress/audit only and do not fire another GitHub workflow.
- Progress row counters are monotonic so rows_fetched/rows_temp/rows_main cannot regress from a later heartbeat or duplicate callback.

Preserved:
- Existing orchestrator single-lane flow.
- PrizePicks ledger installer/status callback.
- workflow_dispatch trigger path.
- No soft pass from stale mlb_stats rows.
- Downstream context/scoring remains blocked until board refresh is certified.

Deploy files:
- worker.js
- control_room.html
- main.py
- scrape.yml
- wrangler.jsonc
- package.json

Test sequence:
1. Deploy the Worker build to prop-ingestion-git.
2. In Control Room, run DATA REFRESHING > Install PrizePicks Ledger.
3. In Control Room, run DATA REFRESHING > Schedule Selected Only with only 05 PrizePicks Board selected.
4. Wait 2 minutes.
5. Run Manual SQL: SELECT run_id, dispatch_id, github_run_id, github_event_name, status, step, progress_message, rows_fetched, rows_temp, rows_main, error_message, heartbeat_at, updated_at FROM prizepicks_scraper_runs ORDER BY datetime(updated_at) DESC LIMIT 20;
6. Run Manual SQL: SELECT request_id, job_key, status, tick_count, started_at, finished_at, updated_at, error, substr(output_json,1,2500) AS output_preview FROM data_refresh_queue WHERE job_key = 'prizepicks_board' ORDER BY datetime(updated_at) DESC LIMIT 5;
7. Confirm the same request_id/dispatch_id is not creating multiple new GitHub workflow runs on later cron ticks.
