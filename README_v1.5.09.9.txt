AlphaDog/OXYGEN-COBALT v1.5.09.9 - Production Clock Finalizer Killer Gate

Purpose:
- Surgical production-clock/orchestrator patch for the previous sequence stall.
- Fixes the failure mode where scheduled_handler_invoked appears, minute locks stay active, scheduled_handler_completed/error never appears, and the next eligible queue row never starts.

Changes:
1. Adds scheduled-handler phase checkpoints around minute-lock cleanup, watchdog, production-clock scan, and orchestrator tick.
2. Adds soft timeout guards around scheduled minute phases so a hanging phase cannot silently prevent completion/error logging.
3. Finalizes data_scheduled_minute_locks as completed/error instead of leaving every acquired lock active forever.
4. Duplicate-suppressed scheduled invocations now also log a terminal scheduled_handler_completed event.
5. Adds stale active minute-lock reaping before each minute-lock acquire.
6. Changes orchestrator selection to prefer the earliest eligible data_refresh_queue row, then mirrors that row into data_orchestrator_jobs before running.
7. Keeps data_orchestrator_jobs as compatibility state, but makes the queue row the authority for cascades.
8. Adds a manual DATA REFRESHING > Killer Cleaner button that resets open broken queue rows, job flags, enqueue locks, minute locks, stale task rows, deferred rows, pipeline locks, and GLOBAL state without touching scoring/data tables.
9. Strengthens Cancel Active Queue so it also releases active scheduled minute locks.

Not touched:
- Scoring math
- PrizePicks board scraper internals
- PrizePicks context math
- Odds API internals
- Main UI release board
- Candidate-board scoring logic
- Static/incremental data models

Expected pass condition:
- scheduled_handler_invoked has scheduled_handler_completed or scheduled_handler_error within the diagnostic window.
- data_scheduled_minute_locks no longer accumulates only active rows.
- An eligible pending queue row with upstream_active_count = 0 starts on the next scheduled tick.
- weather_roof no longer sits pending forever after Everyday Phase 1 completes.
- Killer Cleaner can manually clear broken open orchestration state without manual SQL.
