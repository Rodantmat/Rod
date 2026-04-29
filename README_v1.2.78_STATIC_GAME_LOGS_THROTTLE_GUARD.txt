AlphaDog v1.2.78 - Static Game Logs Throttle Guard

Purpose:
- Patch v1.2.77 static game-log scraping after G5 created Safari/control-room load failures.

Changes:
- Reduces static game-log batch limit from 10 players to 5 players per click.
- Adds a same-job running guard for scrape_static_game_logs_g1..g6.
- If the same game-log group is already running, the Worker returns a clean already_running_wait response instead of starting another overlapping task.
- Static game-log stale running rows older than 2 minutes are reset before a new manual run.
- Control room no longer auto-retries long static Game Logs/BvP jobs 3 times, preventing duplicate running tasks after a frontend load failure.

Testing:
1. Health must show v1.2.78 - Static Game Logs Throttle Guard.
2. Reset any stale running scrape_static_game_logs_g5 rows if needed.
3. Continue STATIC > Scrape Game Logs G5 one click at a time.
4. Expected output: batch_limit 5, attempted_players <= 5, remaining_in_group_after decreases, no duplicate running tasks.
5. Continue G5 to 0, then G6.
