AlphaDog v1.3.77 - Incremental Temp Unique Insert Guard

Patch scope:
- Scheduled backend/control room only.
- No scoring math changes.
- No Main UI changes.
- No D1 live-table mutation during staging.

Fix:
- Temp tables created via CREATE TABLE AS SELECT were missing primary-key/unique behavior.
- INSERT OR REPLACE could therefore behave like duplicate INSERT.
- v1.3.77 adds unique indexes on temp tables and dedupes existing temp rows before enforcing them.

Protected unique keys:
- player_game_logs_temp: player_id + game_pk + group_type
- ref_player_splits_temp: player_id + season + group_type + split_code

Test sequence:
1. Deploy the ZIP.
2. Run DEBUG > Health and confirm v1.3.77 - Incremental Temp Unique Insert Guard.
3. Run CHECK TEMP > All Incremental Temp once. The duplicate list should drop to empty after the first patched check/tick enforces the guard.
4. If an incremental request is still running, wait 5-10 minutes and run CHECK TEMP > All Incremental Temp again.
5. When stage_logs completes, confirm current_step advances to stage_splits.
6. After completion, run CHECK INCREMENTAL > All and confirm live player_game_logs last_game_date advanced beyond 2026-04-28.
