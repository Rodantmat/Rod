ALPHADOG / OXYGEN-COBALT PRODUCTION BACKEND BUILD
Version: v1.5.05.6 - PrizePicks Cron Handshake Gate

PATCH SCOPE
- Preserves v1.5.05.5 no-delta terminal success behavior.
- Adds Cloudflare minute-cron idempotency lock so duplicate scheduled invocations cannot advance the orchestrator twice in the same minute.
- Adds /prizepicks/scraper/status Worker callback endpoint for GitHub scraper status/heartbeat/audit updates.
- Updates scrape.yml GitHub schedule to a safety fallback cadence offset from Worker-controlled dispatch minutes.
- Updates main.py so workflow_dispatch uses the Worker request_id as run_id, scheduled GitHub fallback uses github.run_id, and every scraper phase writes D1 audit + optional Worker callback status.
- Keeps PrizePicks certification audit-based. No stale mlb_stats soft-pass was added.

FILES
- worker.js
- control_room.html
- main.py
- scrape.yml
- wrangler.jsonc

DEPLOY / TEST SEQUENCE
1. Deploy worker.js/control_room.html/wrangler.jsonc to Cloudflare.
2. Commit main.py and scrape.yml to the GitHub repo used by GITHUB_REPO / PROMPT_BASE_URL.
3. In GitHub repo secrets, add ALPHADOG_WORKER_URL or ALPHADOG_WORKER_STATUS_URL if not already present. Use the production Worker base URL, or the full /prizepicks/scraper/status URL.
4. In GitHub repo secrets, add INGEST_TOKEN matching the Worker secret if the Worker requires it.
5. In Control Room, confirm visible version: v1.5.05.6 - PrizePicks Cron Handshake Gate.
6. Run DATA REFRESHING > Schedule Selected Only with only 05 PrizePicks Board selected, or run a controlled cascade when ready.
7. After one minute, run DATA REFRESHING > Orchestrator Status.
8. Confirm prizepicks_board is waiting only while GitHub is actually running, then completes when mlb_stats_refresh_audit has a completed row for the dispatch_id.
9. Run Manual SQL checks for data_scheduled_minute_locks, mlb_stats_refresh_audit, data_refresh_events, and data_refresh_queue if needed.
