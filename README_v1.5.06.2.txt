AlphaDog/OXYGEN-COBALT Scheduled Backend
v1.5.06.2 - GitHub Workflow Dispatch Truth Gate

Purpose:
- Fix PrizePicks board trigger by switching Worker-owned GitHub trigger from repository_dispatch to workflow_dispatch.
- This matches the fine-grained GitHub token permission the user configured: Actions read/write + Metadata read.
- Keeps the existing orchestrator, minute cron, progress ledger, DB audit, queue blocking, and downstream hard gate behavior.

Required GitHub token settings:
- Fine-grained token selected repository: Rodantmat/Rod
- Repository permissions: Actions = Read and write
- Metadata = Read-only

Required Worker bindings/secrets:
- GITHUB_TOKEN = GitHub fine-grained token
- GITHUB_OWNER = Rodantmat (plain var is included in wrangler.jsonc)
- GITHUB_REPO = Rod (plain var is included in wrangler.jsonc)
- GITHUB_WORKFLOW_FILE = scrape.yml (plain var is included in wrangler.jsonc)
- GITHUB_REF = main (plain var is included in wrangler.jsonc)

Deploy notes:
- Deploy the flat files only.
- Do not deploy __pycache__.
- Keep production worker as prop-ingestion-git.
- After deploy, run Install PrizePicks Ledger, then Schedule Selected Only for 05 PrizePicks Board.

Test sequence:
1. Control Room > DATA REFRESHING > Install PrizePicks Ledger.
2. Control Room > DATA REFRESHING > Schedule Selected Only. Select only 05 PrizePicks Board.
3. Wait one minute cron tick.
4. Manual SQL:
SELECT run_id, dispatch_id, github_run_id, github_event_name, status, step, progress_message, rows_fetched, rows_temp, rows_main, error_message, heartbeat_at, updated_at FROM prizepicks_scraper_runs ORDER BY datetime(updated_at) DESC LIMIT 20;
5. Manual SQL:
SELECT request_id, job_key, status, tick_count, started_at, finished_at, updated_at, error, substr(output_json,1,2500) AS output_preview FROM data_refresh_queue WHERE job_key = 'prizepicks_board' ORDER BY datetime(updated_at) DESC LIMIT 5;

Expected after dispatch:
- No missing_github_dispatch_secret if GITHUB_TOKEN is visible to the deployed Worker.
- No repository_dispatch 403 because the Worker now uses workflow_dispatch.
- prizepicks_scraper_runs should show dispatching/dispatched, then main.py progress or failure.
