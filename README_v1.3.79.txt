AlphaDog v1.3.79 - Incremental Force-Due Cursor Advance Repair

Patch scope:
- Scheduled backend / Control Room only.
- No scoring math changes.
- No candidate-board logic changes.
- No Main UI changes.

What changed:
- Force-due incremental auto-runner now selects the active pending/running incremental request even if run_after comparison drifts.
- Minute cron / orchestrator / auto-start triggers now force actual batch execution instead of only touching updated_at.
- Existing active stuck stage_logs request can advance on the next tick without manual SQL surgery.
- Empty-selection terminal guards were added for stage_logs and stage_splits so completed progress advances to the next phase cleanly.
- Version labels were synced in worker.js and control_room.html.

Expected test sequence:
1. Run DEBUG > Health and confirm v1.3.79 - Incremental Force-Due Cursor Advance Repair.
2. Do not cancel the active incremental request unless it fails.
3. Run CHECK TEMP > All Incremental Temp.
4. Wait 5-10 minutes.
5. Run CHECK TEMP > All Incremental Temp again.

Pass signal:
- player_game_logs_temp rows should continue changing or current_step should advance from stage_logs to stage_splits.
- output_preview should show v1.3.79 after the next real tick.
- duplicate_temp_logs should remain empty.

Failure signal:
- updated_at changes but output_preview remains old and row counts/current_step do not change after 10+ minutes.
