AlphaDog v1.5.08.1 - PrizePicks Audit Finalizer Gate

Purpose:
Fix the PrizePicks board stage regression introduced by pre-dispatch seeding.

Root cause fixed:
The single-lane orchestrator seeded prizepicks_scraper_runs before triggerPrizePicksGithubBoardRefresh ran. The trigger function then saw that seed row as a matched dispatch and entered the waiting path instead of sending GitHub workflow_dispatch. That created invisible/non-real PrizePicks waits.

Surgical changes:
- Removed orchestrator-owned pre-dispatch seeding for prizepicks_board.
- Trigger function now owns the full seed -> dispatching -> dispatched lifecycle.
- Added guard so seed-only rows are never treated as proof that dispatch already happened.
- Preserved the existing GitHub workflow_dispatch path, callback/audit certification, dynamic wait, one-shot schedule path, cron path, scoring path, and Control Room layout.

Do not click Run Queue Tick during one-shot test. Use Create One-Shot Full Run, then let cron run it.


Patch v1.5.08.1 surgical fix:
- PrizePicks Board now checks terminal scraper/audit evidence by dispatch/request id before wait/dispatch logic.
- Completed rows_main > 0 in prizepicks_scraper_runs or mlb_stats_refresh_audit immediately finalizes the queue wrapper.
- Failed terminal evidence fails cleanly and blocks downstream instead of looping.
- Prior wait-state extraction now reads nested wrapped result payloads.
- Removed duplicate const repo declaration in triggerPrizePicksGithubBoardRefresh.
