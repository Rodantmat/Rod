AlphaDog v1.2.76 - Static Logs BvP Resume

Purpose
- Finishes the static data phase wiring for player game logs and current-slate BvP.
- Preserves v1.2.75 static player splits resume repair.
- Keeps the one-shot Full Run behavior intact for now.

Key changes
1. Player Game Logs are now resumable like player splits.
   - Run STATIC > Scrape Game Logs G1 until remaining_in_group_after = 0.
   - Then run G2 until 0, then G3, G4, G5, G6.
   - Stores last 20 game logs per player.
   - G1 wipes player_game_logs only on a fresh rebuild start, not on every repeated G1 click.

2. BvP Current Slate is now resumable.
   - Run STATIC > Scrape BvP Current Slate until remaining_pairs_after = 0.
   - It wipes the slate BvP table only on a fresh slate run, not on every repeated click.
   - Missing BvP is not a failure; many batter/pitcher pairs have no history.

3. Output now reports continuation state.
   - Game logs: remaining_in_group_after, needs_continue, total_player_game_logs_after.
   - BvP: remaining_pairs_after, needs_continue, total_ref_bvp_history_after.

Testing order
1. Health check: confirm version v1.2.76 - Static Logs BvP Resume.
2. Static foundation already done: venues, aliases, players, splits.
3. Run Game Logs G1 repeatedly until remaining_in_group_after = 0.
4. Repeat for Game Logs G2-G6.
5. Run CHECK > Static Game Logs.
6. Run BvP Slate repeatedly until remaining_pairs_after = 0.
7. Run CHECK > Static BvP.
8. Run CHECK > All Static Data.

Expected timing
- Game Logs: 10-30 seconds per batch. Each group needs multiple clicks.
- BvP: 15-60 seconds per batch depending slate size.

Files
- worker.js
- control_room.html
