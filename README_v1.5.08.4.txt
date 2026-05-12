AlphaDog v1.5.08.4 - PrizePicks Callback Finalizer Gate

Patch target:
- Production scheduled backend / Control Room only.
- Preserve scheduled backend, schedule scanner, one-shot clock plan, PrizePicks GitHub dispatch, and existing UI flows.

Fix:
- PrizePicks Board completion can now finalize directly when the GitHub callback posts completed rows.
- The callback handler records progress/audit as before, then immediately calls the PrizePicks queue finalizer when status is completed/success and rows_main > 0.
- The finalizer now accepts three valid completion proofs for the exact request id:
  1. prizepicks_scraper_runs completed/success with rows_main > 0
  2. mlb_stats_refresh_audit completed/success/certified with rows_main > 0
  3. data_refresh_events github_prizepicks_scraper_status completed/success callback with rows_main > 0
- Timeout logic must not beat a valid completed callback.

Why:
- v1.5.08.3 proved GitHub and the scraper were working: the board wrote 5206 rows, but the orchestrator stayed locked in WAITING_PRIZEPICKS_BOARD.
- Root cause was wrapper finalization not closing the queue/global lock from the completed callback fast enough.

Test:
1. Deploy this build.
2. Confirm GLOBAL state is IDLE before the next run.
3. Let the scheduled 10PM/full backend chain or one-shot run advance naturally through cron.
4. Watch PrizePicks Board:
   - prizepicks_scraper_runs should reach completed with rows_main > 0.
   - data_refresh_queue prizepicks_board should flip to completed instead of staying running/waiting.
   - prizepicks_context should start after board completion.
