AlphaDog v1.2.86 - Version Sync + Derived Check Lite

Fixes INCREMENTAL > Build Base Derived Metrics by replacing the per-player D1 loop with one D1-only set-based rebuild.

Key points:
- No MLB API calls.
- No Gemini calls.
- No per-player Worker loop.
- Game logs and splits are untouched.
- Rebuilds only incremental_player_metrics from player_game_logs + ref_players.

Test expectation:
- Health shows v1.2.86 - Version Sync + Derived Check Lite.
- INCREMENTAL > Build Base Derived Metrics returns build_mode D1_ONLY_SET_BASED_REBUILD and external_api_calls 0.
