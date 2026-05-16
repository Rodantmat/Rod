AlphaDog / OXYGEN-COBALT
Version: v1.5.10.24 - Incremental Metrics Coverage Gate

Purpose:
Fixes the proven Incremental Daily data-certification gap where completed_no_delta_needed/data_ok=true could occur while incremental_player_metrics was missing real hitters already present in player_game_logs.

Root cause confirmed:
The previous derived metrics builder used player_game_logs but then INNER JOINed ref_players and required p.active = 1. Missing ref_players rows dropped 49 logged hitters from incremental_player_metrics. It also did not restrict the metrics source to group_type='hitting', which allowed pitcher rows to contaminate hitter-style derived metrics.

Surgical changes only:
1. buildIncrementalBaseDerivedMetrics now derives metrics from player_game_logs where group_type='hitting'.
2. ref_players is now LEFT JOIN identity enrichment only; it cannot decide whether a logged hitter receives a metrics row.
3. role is set to BATTER for this hitter metrics rebuild.
4. missing ref_players identity falls back to raw_json player name when available or MLB Player {player_id}.
5. Added certifyIncrementalMetricsCoverage gate.
6. certifyLiveIncrementalTables now blocks clean certification when high-PA or recent logged hitters are missing metrics.
7. no_delta_needed path now runs coverage preflight, performs derived repair if needed, then requires live certification before returning completed_no_delta_needed/data_ok=true.
8. isIncrementalNoDeltaTerminalSuccess no longer treats data_ok=false payloads as successful no-delta terminal success.

Not changed:
- No secrets changed.
- No bindings changed.
- No cron changed.
- No deployment structure changed.
- No worker name changed.
- No D1 binding changed.
- No Main UI changes.
- No Expansion/POTD changes.
- No Everyday Phase 1 redesign in this build.

Expected result:
Running Incremental Daily should repair/backfill missing hitter metrics from player_game_logs and only certify clean when coverage passes.
