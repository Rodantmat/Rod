AlphaDog v1.5.08.5 - Recovery Dispatch Seed Gate

Scope:
- MAIN PRODUCTION scheduled backend / Control Room only.
- Surgical fix for PrizePicks board recovery-created rows that could enter RUNNING without visible seed/dispatch evidence.
- No scoring math changes.
- No Main UI changes.
- No Expansion or POTD changes.

Root issue confirmed by SQL:
- Recovery chain d86f252c-6bc2-400a-95eb-5833b0b0cfd7 created request 6fa88ac1-25ea-4491-8741-c0feb6ef1fc9.
- data_refresh_queue showed prizepicks_board RUNNING.
- data_orchestrator_state GLOBAL was locked on prizepicks_board.
- prizepicks_scraper_runs had no seed row for 6fa88ac1.
- mlb_stats_refresh_audit had no row for 6fa88ac1.
- data_refresh_events/data_orchestrator_logs had no workflow_dispatch evidence for 6fa88ac1.

Fix summary:
1. Stale recovery enqueue payloads are no longer treated as prior PrizePicks dispatch evidence merely because they contain requested_at/request_id.
2. Prior PrizePicks state is reused only when it contains real dispatch/wait/certification evidence.
3. Locked PrizePicks board jobs are allowed to continue on later cron ticks even when their last_status is still plain running, so a silently stranded recovery row can execute the seed + workflow_dispatch path instead of staying busy forever.
4. Existing callback/audit reaper remains preserved and still finalizes completed PrizePicks rows from real scraper/audit completion.

Expected behavior after deploy:
- The stuck 6fa recovery row should be continued by the minute cron.
- It should create a prizepicks_scraper_runs seed row for 6fa88ac1.
- It should dispatch GitHub workflow_dispatch or fail explicitly with output_json/error.
- If GitHub dispatch is accepted, queue output should move into explicit waiting_for_board_update state.
- Once callback/audit completes, prizepicks_board should complete and downstream context/odds/scoring should advance.
