AlphaDog v1.3.19 - Phase 3 Stale Pending Finalizer

Base: v1.3.18 - Phase 3 Multi-Wave Window Runner

Surgical fix only:
- At the start of every Phase 3A/3B tick, PENDING board_factor_queue rows with datetime(start_time) <= datetime('now','+15 minutes') are finalized as SKIPPED_STALE.
- SKIPPED_STALE rows are never sent to Gemini.
- Completion logic now uses actionable_pending_rows instead of raw pending rows.
- If actionable pending is 0, retry/error/running rows are 0, and stale skipped rows are the only remaining unfinished rows, the deferred run finishes as COMPLETED_WITH_SKIPS with data_ok=true when certified results exist.
- Check Full Run now reports total_rows, completed_rows, actionable_pending_rows, pending_rows, skipped_stale_rows, retry_later_rows, running_rows, error_rows, and final status.

Preserved from v1.3.18:
- Multi-wave mining
- Gemini governor
- No-parallel GLOBAL_PHASE3_SCHEDULED_PIPELINE lock
- 8-minute stale lock window
- Sleeper text ingest
- Sleeper video parser files
- Control Room layout
- 4AM cron
- No final scoring
- No market/RBI/RFI expansion changes

Deployment test:
1. Deploy this flat ZIP.
2. Run PHASE 3A/3B > Check Full Run.
3. Run PHASE 3A/3B > Schedule Daily 4AM only if no clean request exists.
4. Wait 3-5 minutes, then Check Full Run again.
5. If only stale/too-close rows remain, expected final request status is COMPLETED_WITH_SKIPS.
