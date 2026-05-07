AlphaDog Expansion Worker v0.1.13 - Phase 1 Context Snapshot

Scope:
- Isolated expansion worker/control room only.
- Reads existing production-prepared tables as source data only.
- Writes only xp_* tables.
- No production scheduled backend changes.
- No Main UI changes.
- No scoring yet.

New in v0.1.13:
- Adds xp_phase1_player_metrics_current.
- Adds xp_phase1_game_context_current.
- Adds Build Context button and context diagnostics.
- Copies Phase 1 player K/BB metric snapshots from incremental_player_metrics into xp_* only.
- Builds Phase 1 game context from xp_prop_lines_current + xp_game_bridge_current + games + lineups_current + starters_current + copied metric snapshot.
- Preserves goblin/demon/standard line variants separately.
- Carries warning flags instead of filling missing data with fake zeroes.

Required test sequence:
1. Health
2. Apply Schema
3. Refresh Board
4. Build Bridge
5. Bridge Counts
6. Build Context
7. Context Counts
8. Missing Metrics
9. Completeness
10. Context Sample
11. Copy Output

Expected:
- Version: v0.1.13 - Phase 1 Context Snapshot
- Build Bridge writes 452 rows for Phase 1 on the validated May 7 board.
- Build Context writes 452 rows to xp_phase1_player_metrics_current and 452 rows to xp_phase1_game_context_current.
- No production tables are mutated.
- No scoring tables are created.
