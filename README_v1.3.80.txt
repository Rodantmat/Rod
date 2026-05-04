AlphaDog v1.3.80 - Incremental Stage Completion Finalizer

Surgical patch over v1.3.79.

Fixes:
- Adds certified coverage finalizer for incremental temp stage_logs.
- Adds certified coverage finalizer for incremental temp stage_splits.
- Prevents stage_logs/stage_splits from running forever once temp coverage is already sufficient.
- Keeps unique temp insert guard from v1.3.77.
- Keeps progress reconciliation from v1.3.78/v1.3.79.
- Writes compact current tick output_json so status previews stop showing stale giant old blobs.
- Keeps orchestrator/cancel/queue protections intact.

Expected flow:
1. Active request may continue from the current running row.
2. Next cron/orchestrator tick should finalize stage_logs if temp game-log rows meet certified threshold.
3. Then it should progress: stage_splits -> audit -> promote -> clean -> derived -> completed.

Test sequence:
1. DEBUG > Health. Confirm v1.3.80 - Incremental Stage Completion Finalizer.
2. DATA REFRESHING > Orchestrator Status. Confirm no unexpected parallel queue rows.
3. CHECK TEMP > All Incremental Temp. Confirm latest_temp_refresh current_step.
4. Wait 2-4 minutes. Run CHECK TEMP > All Incremental Temp again.
5. Expected: current_step advances out of stage_logs, or output_preview shows v1.3.80 with stage_finalizer.
6. When completed, run CHECK > Incremental All. Confirm last_game_date advanced and data_ok true or review only non-critical warnings.

Do not manually spam Run One Refresh Tick. The minute cron/orchestrator should continue it.
