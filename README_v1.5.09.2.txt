AlphaDog / OXYGEN-COBALT Backend Build
v1.5.09.2 - Scoring Partial Continue Queue Gate

Patch target:
- Scheduled backend/control-room worker only.
- Surgical fix for scoring_refresh queue terminalization.

Root issue fixed:
- run_full_scoring_refresh_v1 can correctly return SCORING_PARTIAL_CONTINUE after making durable scoring progress.
- The single-lane queue wrapper previously let max_attempt/tick logic terminalize that continuable state as failed.
- That blocked automatic minute-cron pickup and left the candidate board stale until manual intervention.

What changed:
1. Added explicit scoring partial-continue detection for scoring_refresh.
2. SCORING_PARTIAL_CONTINUE is now treated as a continuable queue state, not terminal failure, even when data_ok=false.
3. The queue row is requeued as pending with run_after +1 minute and run_requested_flag=1 so the minute cron continues automatically.
4. Added self-heal recovery for existing failed scoring_refresh rows whose error/output contains SCORING_PARTIAL_CONTINUE.
5. Existing failed scoring partial rows are requeued automatically by the normal minute-cron self-heal; no manual queue tick is required.

Explicitly not touched:
- Scoring math
- Same-slate scoring gate
- Odds API fetch/certification/promotion
- PrizePicks Board
- PrizePicks Context
- Everyday Phase 1
- Main UI
- Slate AUTO logic
- Candidate-board scoring/publish formulas

Expected automatic behavior after deploy:
- The production minute cron runs.
- selfHealRefreshOrchestratorState detects failed scoring_refresh rows with SCORING_PARTIAL_CONTINUE.
- The scoring_refresh row is reset to pending and due now.
- The next minute tick continues scoring without manual button presses.
- Queue should stop converting SCORING_PARTIAL_CONTINUE into failed.
