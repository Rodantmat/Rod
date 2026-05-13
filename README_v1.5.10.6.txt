AlphaDog / OXYGEN-COBALT
v1.5.10.6 - Incremental Delta Microbatch Gate

Patch purpose:
- Fix incremental_daily getting stuck in RUNNING_WAITING_CHECK while the child incremental_temp_refresh_runs row parks on stage_delta_logs.
- Force delta game-log staging into a bounded microbatch: 1 game per orchestrator cron tick, capped at 2 if explicitly overridden.
- Add heartbeat writes before stage execution, before each external MLB boxscore fetch, and after each game completes.
- Add parent queue heartbeat output_json when a queue tick starts so no queue row stays silent/null.
- Keep the hard-reset Killer Cleaner behavior from v1.5.10.4.

Protected tables not intentionally wiped by this patch:
score_candidate_board, prizepicks_current_market_context, odds_api_events, odds_api_game_markets, odds_api_player_props, games, markets_current, starters_current, lineups_current, incremental_player_metrics, player_game_logs, ref_player_splits, data_refresh_events, data_orchestrator_logs.

Expected test path:
1. Run Killer Cleaner first.
2. Verify active rows/locks are zero.
3. In DATA REFRESHING > PRODUCTION CLOCK ORCHESTRATOR, select only Incremental Daily Delta.
4. Click Schedule Selected Only.
5. Use the SQL commands provided in chat to monitor queue, global state, incremental temp run, and temp table row counts.

Expected behavior:
- The parent data_refresh_queue row should update output_json each tick.
- The child incremental_temp_refresh_runs row should show heartbeat output_json, not stale silent payload.
- player_game_logs_temp should begin increasing after successful boxscore microbatches.
- The parent queue should release between partial_continue ticks instead of staying permanently locked.
