AlphaDog/OXYGEN-COBALT v1.4.22 - Candidate Board Idempotent Publish Fix

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
2. Open Control Room > DEBUG > Health. Confirm version v1.4.22 and odds_api_key_bound=true.
3. Open DATA REFRESHING > Production Clock Status. Confirm no active stuck queue before a manual test.
4. Run DATA REFRESHING > Schedule Cascade once.
5. Wait 2 minutes, then run Manual SQL:
SELECT request_id, chain_id, job_key, display_name, status, requested_slate_date, run_after, started_at, finished_at, tick_count, retry_count, error, updated_at FROM data_refresh_queue ORDER BY created_at DESC, sequence_order ASC LIMIT 40;
6. After the cascade completes, run Manual SQL:
SELECT COUNT(*) AS rows_count, MIN(start_time) AS first_start_time, MAX(start_time) AS last_start_time, MAX(updated_at) AS newest_updated_at, SUM(CASE WHEN datetime(start_time) > datetime('now') THEN 1 ELSE 0 END) AS future_rows FROM prizepicks_current_market_context;
7. Then run Manual SQL:
SELECT slate_date, COUNT(*) AS rows_count, MAX(updated_at) AS newest_updated_at FROM score_candidate_board GROUP BY slate_date ORDER BY slate_date DESC LIMIT 10;

v1.4.22 surgical additions:
- Odds API now resolves its slate from the active future PrizePicks board first, then raw mlb_stats, then requested slate fallback.
- Odds failures now expose requested_slate_date, resolved_odds_slate_date, slate_resolution_reason, and certification error in queue output.
- Phase 2C chunk size increased safely to reduce long current-board rebuild time.
- Phase 2C prunes old current-context rows to the latest active board window after completion.
- Production watchdog can recover stale/behind board state at the diagnostic windows without changing routes, URLs, UI, or scoring math.


v1.4.22 surgical additions:
- Fixed Odds API runtime bug: slate_resolution is now returned as slateResolution and no longer throws ReferenceError.
- Added GitHub dispatch alias resolver for repo/token/workflow/ref so the PrizePicks board refresh path uses the same binding-safe style as Odds API.
- Health now exposes github_dispatch_binding with source/checked names.
- Preserved v1.4.20 active-slate odds resolver, non-blocking scoring, and watchdog behavior.


v1.4.22 surgical addition:
- Fixes score_candidate_board publish failure caused by duplicate candidate_key collisions during scoring_refresh.
- Keeps the existing selected-slate DELETE, then uses ON CONFLICT(candidate_key) DO UPDATE to make candidate-board writes idempotent.
- On duplicate candidate keys inside the same rebuild batch, the higher final_score row wins so the board publishes instead of crashing.
- Does not change scoring math, odds math, PrizePicks scraping, schedule paths, URL paths, or Control Room layout.

Required validation after deploy:
1. Open Control Room > DEBUG > Health. Confirm version v1.4.22.
2. Run DATA REFRESHING > Schedule Cascade with scoring_refresh only if latest PrizePicks context and Odds API are already fresh. Otherwise run from prizepicks_context through scoring_refresh.
3. Run Manual SQL:
   SELECT slate_date, COUNT(*) AS rows_count, MAX(updated_at) AS newest_updated_at FROM score_candidate_board GROUP BY slate_date ORDER BY slate_date DESC LIMIT 10;
4. Confirm the newest slate has rows and scoring_refresh no longer fails with UNIQUE constraint failed: score_candidate_board.candidate_key.
5. Open Main UI board and verify rows display.
