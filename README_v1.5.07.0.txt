AlphaDog / OXYGEN-COBALT
v1.5.07.0 - Scoring Queue Finalizer Gate

Purpose:
- Preserves the successful v1.5.07.0 capsule parity fixes for PrizePicks, Odds API Morning, and Odds API Intraday.
- Fixes scoring_refresh queue finalization when scoring writes active_score_board/scoring_audit_logs but the orchestrator row stays running.
- Makes queue-owned scoring use the queue request_id as the scoring run_id when possible, so data_refresh_queue, scoring_audit_logs, active_score_board, and score_candidate_board can be tied together cleanly.
- Adds a scoring queue finalizer that detects completed scoring from scoring_audit_logs + active_score_board, publishes a fast candidate board from active rows if needed, marks scoring_refresh completed, releases the global lock, and lets the chain finish.

No scoring math changes. No Main UI changes. No static/incremental/PrizePicks/Odds API logic rewrites.
