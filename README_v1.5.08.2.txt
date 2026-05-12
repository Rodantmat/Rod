AlphaDog v1.5.08.2 - PrizePicks Completion Reaper Gate

Purpose:
Fix the PrizePicks Board wrapper timeout bug where the GitHub scraper completed and wrote fresh board rows, but the orchestrator failed the prizepicks_board queue row before converting the completed audit/progress row into queue completion.

Surgical change:
- Adds a PrizePicks completion reaper that checks prizepicks_scraper_runs and mlb_stats_refresh_audit by the queue request_id/dispatch_id.
- Completion/progress rows with rows_main > 0 now win before any dynamic timeout or downstream blocking decision.
- The reaper runs during preflight cleanup, active-lock timeout checks, locked PrizePicks state checks, and stale running-row recovery.
- If the reaper finalizes PrizePicks Board, it marks the queue row completed, clears job/global/enqueue locks, and unblocks downstream rows that were blocked only by a PrizePicks timeout race.
- PrizePicks runtime safety floor/cap was widened to reduce false timeouts on larger boards while still requiring real audit/progress completion.

Test sequence:
1. Deploy this build.
2. In Control Room, use DATA REFRESHING > Create One-Shot Full Run.
3. Do not click Run Queue Tick. Let the minute cron run.
4. Check the chain with Manual SQL. PrizePicks Board should become completed after prizepicks_scraper_runs/mlb_stats_refresh_audit shows completed rows_main > 0.
5. PrizePicks Context and Scoring Board should not be blocked by a PrizePicks timeout if the scraper completed.
