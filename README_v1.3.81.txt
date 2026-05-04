AlphaDog v1.3.81 - Incremental Hard Stage Reconciler

Purpose:
- Hard-fix active incremental requests stuck in stage_logs after temp game logs are already certified.
- Advance stage_logs -> stage_splits using actual temp table counts, not stale cursor/output_json.
- Advance stage_splits -> audit once split temp rows are certified.
- Clear stale old output_json previews when hard reconciliation fires.
- Preserve duplicate guards, orchestrator flow, and live-table safety.

Patch scope:
- worker.js
- control_room.html version label only
- wrangler.jsonc unchanged
- package.json unchanged

Test sequence:
1. Deploy ZIP.
2. Run DEBUG > Health. Confirm v1.3.81 - Incremental Hard Stage Reconciler.
3. Run CHECK TEMP > All Incremental Temp.
4. Expected if player_game_logs_temp >= 10000 and duplicates are clean: hard_reconcile.changed=true and current_step changes to stage_splits.
5. Wait 2-4 minutes for cron/orchestrator to continue.
6. Run CHECK TEMP > All Incremental Temp again. Expected: ref_player_splits_temp starts increasing or current_step moves toward audit once splits are certified.
