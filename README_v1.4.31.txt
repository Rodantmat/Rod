AlphaDog v1.4.31 - Scoring Lifecycle Finalizer

Purpose:
- Stop scoring_refresh from self-locking behind stale AUTO_SCORING_REFRESH_V1 locks.
- Make queued scoring use the database queue as the only scoring lock.
- Prevent active selected-slate board data from being purged before a replacement scoring run is allowed to start.
- Keep volatile data lifecycle strict: temp tables clear before/after Odds API runs, old odds slates purge, old candidate-board slates purge, and selected-slate release rows are upserted safely.
- Keep Schedule Cascade fast-return only: enqueue rows and return; no browser scoring, no browser purge, no browser auto tick.

Patch notes:
1. run_full_scoring_refresh_v1 detects queue-owned scoring by queue_request_id / queue_chain_id / backend_orchestrator / orchestrator_internal.
2. Queue-owned scoring deletes obsolete AUTO_SCORING_REFRESH_V1 locks and never acquires that pipeline lock.
3. Manual/direct scoring still uses a short pipeline lock, but the Control Room Schedule Cascade path is queue-owned.
4. run_mlb_scoring_v1 now proves no fresh scoring run is active before volatile scoring cleanup begins.
5. Stale zero-progress scoring runs are finalized faster; fresh active rows preserve the current board instead of wiping it.
6. Odds API promotion now replaces the active slate tables from certified temp rows instead of accumulating old windows/buckets.
7. Odds API temp tables are cleared after promotion or failure.
8. Candidate board keeps the selected slate live while rebuilding, purges non-selected slate rows, and upserts selected rows.
9. Existing goblin/demon pickability bridge is preserved: OVER can bridge from More-only rows; UNDER is never manufactured from goblin/demon.
10. Fixed an unrelated latent board_queue_auto_mine cleanup bug where a finally block referenced queueOwned without defining it.

Test sequence:
1. Deploy this ZIP.
2. Run DEBUG > Health and confirm v1.4.31 - Scoring Lifecycle Finalizer.
3. Run DATA REFRESHING > Schedule Cascade with scoring_refresh only.
4. Wait 2-4 minute-cron ticks.
5. Run the SQL tests from the chat response.
