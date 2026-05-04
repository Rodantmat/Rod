AlphaDog v1.3.82 - Incremental Split Stale Finalizer

Patch scope:
- Worker-only surgical repair for incremental temp split stage.
- Preserves v1.3.81 hard stage reconciliation for stage_logs.
- Adds partial-safe split finalization at clean 650+ split rows.
- Aligns audit threshold with split finalizer.
- Promotion remains INSERT OR REPLACE only; existing live split rows are not deleted.
- Keeps orchestrator/cancel protections and compact outputs.

Why:
The active incremental request escaped stage_logs but became trapped in stage_splits with clean temp data and no duplicate rows. This patch allows clean usable partial split coverage to advance to audit/promote instead of waiting forever for full split rebuild coverage.

Test sequence:
1. Deploy this ZIP.
2. Run DEBUG > Health and confirm v1.3.82 - Incremental Split Stale Finalizer.
3. Run CHECK TEMP > All Incremental Temp.
4. Expected: current_step should advance from stage_splits to audit on the next tick/reconcile because ref_player_splits_temp already has 650+ clean rows.
5. Wait 2-5 minutes.
6. Run CHECK TEMP > All Incremental Temp again.
7. Expected sequence: audit -> promote -> clean -> derived -> completed.
8. After completed, run CHECK INCREMENTAL > All Incremental Live if available, or SQL-check live player_game_logs/ref_player_splits/incremental_player_metrics updated_at and max game_date.
