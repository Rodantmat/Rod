AlphaDog v1.2.89 - Incremental Temp Idempotent Promote

Purpose:
- Fix Daily Incremental Temp pipeline promotion failure caused by duplicate temp rows hitting live table UNIQUE constraints.

Surgical changes only:
1. Version sync updated to v1.2.89 in worker and control room.
2. Daily incremental temp staging clears temp tables before staging.
3. Temp game logs are deduped by player_id + game_pk + group_type.
4. Temp splits are deduped by player_id + season + group_type + split_code.
5. Audit now blocks promotion if duplicate temp keys exist.
6. Promotion uses idempotent INSERT OR REPLACE after dedupe, not blind insert.
7. Promotion can be safely rerun without UNIQUE constraint crashes.
8. Existing flow preserved: stage temp -> audit -> promote -> clean temp -> rebuild derived.

Test order:
1. Daily Incremental Temp > Clean Incremental Temp
2. Daily Incremental Temp > Schedule Daily Temp Test
3. Wait 8-12 minutes.
4. Daily Incremental Temp > Check Incremental Temp
5. Daily Incremental Temp > Audit Incremental Temp
6. CHECK > Incremental All

Expected:
- latest_temp_refresh status completed
- no UNIQUE constraint failure
- audit grade A or A+
- temp cleaned after completed pipeline
- derived rebuilt
- Incremental All pass
- orphan_logs_without_ref_player: 0
