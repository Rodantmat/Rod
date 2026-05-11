AlphaDog v1.5.07.5 - Scoring Completion Reaper Gate

Patch scope:
- Production scheduled backend only.
- Adds a scoring completion reaper inside refresh_orchestrator_tick.
- If scoring_refresh is stuck RUNNING but scoring_runs shows a completed same-slate run after the queue start, the queue row is finalized as completed and the GLOBAL single-lane lock is released.
- Uses scoring_runs columns only: run_id, slate_date, status, rows_targeted, rows_certified, rows_promoted, rows_active, created_at, completed_at, error, details_json.
- Does not use scoring_audit_logs.active_rows because that column does not exist.
- Preserves v1.5.07.4 cascade eligibility behavior.
- No scoring math change. No Main UI change. No PrizePicks scraper change.

Expected validation after deploy:
1. Open Control Room.
2. Do not click any run button.
3. Wait for the next minute cron tick.
4. Run Manual SQL status checks only if needed.

Main expected result:
- data_orchestrator_state.GLOBAL becomes IDLE.
- data_refresh_queue row ef2a5807-b87a-4ae0-80c7-9c9f4f62f70a becomes completed.
- scoring_refresh output_json mentions SCORING_QUEUE_FINALIZED_FROM_SCORING_RUNS_REAPER.

If scoring has not completed in scoring_runs yet, the reaper does nothing and normal timeout/continuation logic remains unchanged.
