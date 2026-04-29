AlphaDog v1.2.88 - Missing Ref Player Repair

Purpose:
- Adds INCREMENTAL > Repair Missing Ref Players.
- Detects player IDs present in player_game_logs/ref_player_splits but missing from ref_players.
- Fetches MLB StatsAPI people identity for each orphan ID.
- Inserts repaired reference rows into ref_players as active=0 by default so the active roster universe stays stable.
- Intended sequence after deploy:
  1) CHECK > Incremental All
  2) INCREMENTAL > Repair Missing Ref Players
  3) INCREMENTAL > Build Base Derived Metrics
  4) CHECK > Incremental All

Expected result for current issue:
- player_id 664126 repaired into ref_players.
- orphan_logs_without_ref_player becomes 0.
- Incremental All remains pass/data_ok true.
