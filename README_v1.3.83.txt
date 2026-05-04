AlphaDog v1.3.83 - Incremental Pristine Certification Guard

Patch scope:
- Scheduled backend/control room only.
- Preserves prior incremental completion fix.
- Adds live incremental certification after derived rebuild before marking the request completed.
- Adds manual job: certify_incremental_live_tables.
- Adds incremental_live_certification_audits table for durable certification records.

Certification gates:
- player_game_logs >= 9000 rows.
- ref_player_splits >= 1000 rows.
- incremental_player_metrics >= 770 rows.
- zero duplicate game-log keys.
- zero duplicate split keys.
- zero null required keys.
- derived metrics latest_last_game_date must not lag player_game_logs latest game_date.
- batter and pitcher metric coverage must each be >= 350 rows.

Failure behavior:
- If final live certification fails, the run is marked failed and downstream cascade must not trust it.
- Promotion remains INSERT OR REPLACE only; it does not delete live rows.
- Temp cleanup still happens only after certification/promotion path.

Test sequence:
1. Deploy.
2. DEBUG > Health, confirm v1.3.83.
3. Run CERTIFY > Incremental Live Tables.
4. Expected: data_ok true, certification_grade A or A+.
5. Future incremental runs must finish with live_certification in the final output.
