AlphaDog/OXYGEN-COBALT v1.5.05.9 - PrizePicks Repository Dispatch Bridge

Surgical scope:
- Keeps the working single-lane orchestrator and no-delta incremental fixes intact.
- Keeps the PrizePicks ledger installer/status callback intact.
- Changes the PrizePicks board trigger from fragile workflow_dispatch-only handling to repository_dispatch with event type alphadog_prizepicks_board.
- Updates scrape.yml so GitHub can run from repository_dispatch, manual workflow_dispatch, and a */15 fallback cron.
- Updates main.py progress payloads with request/chain/slate metadata and keeps writing prizepicks_scraper_runs plus mlb_stats_refresh_audit.
- Updates GitHub run visibility lookup so it can see workflow_dispatch, repository_dispatch, and schedule events on the configured workflow/ref.

Required GitHub secrets for the scraper repo:
- CF_API_TOKEN
- CF_ACCOUNT_ID
- CF_DATABASE_ID
- PROXY_URL
- ALPHADOG_WORKER_URL = https://prop-ingestion-git.rodolfoaamattos.workers.dev
- INGEST_TOKEN

Required Worker secrets/vars:
- GITHUB_REPO should point to the scraper repo, expected current repo: Rodantmat/Rod
- GITHUB_TOKEN must be able to dispatch repository events and read Actions runs
- GITHUB_WORKFLOW_FILE should be scrape.yml unless changed
- GITHUB_REF should be main unless changed
- ALPHADOG_WORKER_URL should be https://prop-ingestion-git.rodolfoaamattos.workers.dev

Test sequence:
1. Deploy Worker files.
2. Commit scrape.yml and main.py into the GitHub scraper repo/branch targeted by GITHUB_REPO/GITHUB_REF.
3. Confirm the scraper repo has ALPHADOG_WORKER_URL and INGEST_TOKEN secrets.
4. In Control Room, run DATA REFRESHING > Install PrizePicks Ledger once.
5. In Control Room, run DATA REFRESHING > Schedule Selected Only with only 05 PrizePicks Board selected.
6. Wait 1-2 minute cron ticks.
7. Run Manual SQL:
   SELECT run_id, dispatch_id, github_run_id, github_event_name, status, step, progress_message, rows_fetched, rows_temp, rows_main, error_message, heartbeat_at, updated_at FROM prizepicks_scraper_runs ORDER BY datetime(updated_at) DESC LIMIT 10;
8. Then run DATA REFRESHING > Orchestrator Status.

Expected pass:
- prizepicks_scraper_runs receives a row for the dispatch_id.
- Status moves through dispatched/running steps and ends completed with rows_main > 0.
- 05 PrizePicks Board completes and downstream board/context/scoring are no longer blocked by PrizePicks board.
