AlphaDog v1.5.10.12 - Incremental Hard Reconcile Bypass Gate

Patch purpose:
- Fix incremental_daily getting stuck at stage_delta_logs before any MLB schedule/boxscore fetch.
- The previous build proved the child tick entered, but the pre-stage hard reconciler could consume the worker window before stage_delta_logs started real work.
- v1.5.10.12 bypasses the heavy hard reconciler only for current_step='stage_delta_logs'. The delta stage now owns schedule fetch, finalized-game selection, boxscore staging, pass/continue state, and progress output.

Protected:
- Does not wipe real data tables.
- Does not touch score_candidate_board, prizepicks_current_market_context, odds tables, games, markets_current, starters_current, lineups_current, player_game_logs, ref_player_splits, incremental_player_metrics, data_refresh_events, or data_orchestrator_logs.

Expected proof after deploy:
- Killer Cleaner shows v1.5.10.12.
- Schedule Selected Only shows v1.5.10.12.
- Incremental child should move past tick_pre_hard_reconcile into stage_delta_logs_entered_pre_mode / schedule_fetch / stage_delta_logs_started.
