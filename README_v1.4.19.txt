AlphaDog/OXYGEN-COBALT v1.4.19 - Production Refresh Final Guard

Surgical production scheduled-backend patch over v1.4.18.

Changed only the production refresh/orchestrator guard areas:
- Hardened Odds API key resolver with direct, alternate, nested, and normalized binding-name scan.
- PrizePicks board refresh no longer certifies stale rows as fresh; freshness requires fresh future board rows.
- PrizePicks GitHub dispatch wait is capped so it cannot trap the full cascade indefinitely.
- Phase 2C PrizePicks context chunk size increased safely to reduce long current-board conversion time.
- prizepicks_current_market_context is now treated as current-board only: old rows are deleted when a new current board run starts.
- mlb_stats old PrizePicks raw board rows are cleaned after a fresh latest-board window is detected, keeping only the latest capture window buffer.
- Optional Odds API failures are terminal for that row and release downstream scoring immediately instead of delaying the whole refresh.
- Watchdog can recover stale null-run_after queue rows and can enqueue one safe cascade at the diagnostic windows if the board has no future rows and no queue is active.
- Existing URL, paths, worker name, wrangler structure, Control Room structure, and scoring math remain unchanged.

Test sequence:
1. Deploy this flat ZIP to the existing worker/repo.
2. Open Control Room > DEBUG > Health. Confirm version v1.4.19 and odds_api_key_bound=true.
3. Open DATA REFRESHING > Production Clock Status. Confirm no active stuck queue before a manual test.
4. Run DATA REFRESHING > Schedule Cascade once.
5. Wait 2 minutes, then run Manual SQL:
SELECT request_id, chain_id, job_key, display_name, status, requested_slate_date, run_after, started_at, finished_at, tick_count, retry_count, error, updated_at FROM data_refresh_queue ORDER BY created_at DESC, sequence_order ASC LIMIT 40;
6. After the cascade completes, run Manual SQL:
SELECT COUNT(*) AS rows_count, MIN(start_time) AS first_start_time, MAX(start_time) AS last_start_time, MAX(updated_at) AS newest_updated_at, SUM(CASE WHEN datetime(start_time) > datetime('now') THEN 1 ELSE 0 END) AS future_rows FROM prizepicks_current_market_context;
7. Then run Manual SQL:
SELECT slate_date, COUNT(*) AS rows_count, MAX(updated_at) AS newest_updated_at FROM score_candidate_board GROUP BY slate_date ORDER BY slate_date DESC LIMIT 10;
