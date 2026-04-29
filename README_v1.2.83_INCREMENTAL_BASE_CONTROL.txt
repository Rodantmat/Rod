AlphaDog v1.2.83 - Incremental Base Control

Adds a dedicated Incremental scrape/check control-room block.

New scrape jobs:
- incremental_base_game_logs_g1..g6
- incremental_base_splits_g1..g6
- incremental_base_derived_metrics

New check jobs:
- check_incremental_game_logs
- check_incremental_player_splits
- check_incremental_derived_metrics
- check_incremental_all

Notes:
- No Gemini is used for the incremental history base.
- Game logs and splits reuse the proven MLB API resumable group-batch logic.
- Derived metrics are computed from player_game_logs already stored in D1.
- Check outputs avoid large raw_json payloads.
