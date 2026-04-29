AlphaDog v1.2.77 - Static Game Logs Resume Repair

Purpose:
- Patch v1.2.76 game-log static scrape so it no longer attempts a full 130-player group in one Worker invocation.
- Use the same small resumable batch pattern proven by v1.2.75 static player splits.

Root cause fixed:
- v1.2.76 selected 130 players per game-log group and fetched until Cloudflare subrequest exhaustion.
- It returned pass even when errors existed.

Expected behavior:
- Game Logs G1-G6 now process about 10 players per click by default.
- Repeated clicks resume the same group.
- remaining_in_group_after decreases by attempted clean batch size.
- status is partial_continue until the group is complete.
- pass only when the group is done/clean.
- G1 wipes player_game_logs only at a fresh rebuild start, not on every G1 click.

Test order:
1. Health must show v1.2.77 - Static Game Logs Resume Repair.
2. Run Game Logs G1 repeatedly until remaining_in_group_after = 0.
3. Run G2 through G6 the same way.
4. Run Check Static Game Logs.
5. Run BvP Current Slate and Check Static BvP after logs are certified.
