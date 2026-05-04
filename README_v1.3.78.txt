AlphaDog v1.3.78 - Incremental Progress Reconciliation Repair

Scope:
- Scheduled backend/control room only.
- No scoring math changes.
- No Main UI changes.
- No D1 schema-destructive changes beyond existing protected temp-table/index creation.

Root fix:
- v1.3.77 stopped duplicate temp rows, but the incremental stage_logs step could keep looping when staged rows already existed and progress did not advance cleanly.
- v1.3.78 reconciles progress from player_game_logs_temp/ref_player_splits_temp before and after each bounded batch.
- Already-staged players are marked COMPLETED in static_scrape_progress so the cursor can move forward instead of reprocessing the same batch.
- Active player selection is de-duplicated by player_id before batching.

Expected behavior:
- Existing running incremental request should continue without canceling.
- stage_logs should advance past the stuck progress point.
- Once stage_logs completes, the same request advances to stage_splits, then audit, promote, clean, derived, completed.

Test sequence:
1. Run DEBUG > Health and confirm v1.3.78 - Incremental Progress Reconciliation Repair.
2. Run CHECK TEMP > All Incremental Temp.
3. Wait 2-3 cron minutes.
4. Run CHECK TEMP > All Incremental Temp again.
5. Confirm progress_done increases beyond the prior stuck value of 534 or current_step moves from stage_logs to stage_splits.
6. Do not cancel unless the latest_temp_refresh status becomes failed.
