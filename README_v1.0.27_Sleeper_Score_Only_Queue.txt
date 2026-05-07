AlphaDog Main UI v1.0.27 - Sleeper Score-Only Queue

Base: v1.0.26 - Board Restore Sleeper Date Guard.

Surgical fix only:
- Preserved Main UI board, filters, RBI tabs, and Sleeper Feed screen.
- Preserved the May date parser fix that converts raw Sleeper lines like “May 7 9:35AM” into slate_date 2026-05-07.
- Preserved replacement behavior: Save Sleeper Feed replaces the current Sleeper RBI/RFI board.
- Preserved certification behavior: regular RBI rows become CERTIFIED_BOARD_PRESENT in sleeper_rbi_rfi_market_signals.
- Removed the bad Sleeper auto-rescore behavior that queued deferred_full_run_once/run_full_pipeline.
- Sleeper Feed Save now queues score-only work in data_refresh_queue:
  - job_key: scoring_refresh
  - job_name: run_full_scoring_refresh_v1
  - group_name: 05 Release Board
- On new Sleeper save, old pending/running v1.0.25/v1.0.26 Sleeper full-refresh requests for the same slate are cancelled.
- Admin Refresh Full Data still uses deferred_full_run_once/run_full_pipeline and was not converted.

Expected Sleeper Feed response:
Sleeper Feed saved and certified. Parsed: X. Saved: X. Slate date: YYYY-MM-DD. Score-only refresh queued. Wait 5-10 minutes for the updated board.

Test sequence:
1. Deploy this Main UI build.
2. Open Main UI > Sleeper Feed.
3. Paste the same Sleeper block.
4. Tap Save Sleeper Feed.
5. Confirm response says score-only refresh queued.
6. In production Control Room Manual SQL, run:
   SELECT request_id, chain_id, job_key, job_name, status, run_after, requested_slate_date, started_at, finished_at, error, substr(output_json,1,700) AS output_preview FROM data_refresh_queue WHERE requested_slate_date='2026-05-07' ORDER BY created_at DESC LIMIT 10;
7. Wait 5-10 minutes.
8. Check scoring_runs for a new run after the save timestamp.
