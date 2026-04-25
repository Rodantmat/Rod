AlphaDog MLB API Schedule Lock Patch

Root cause fixed:
- Gemini games/markets schedule did not match MLB API starters schedule.
- Truth Audit showed missing starters because game_id sets were different.

Fix:
- scrape_games_markets now uses MLB Stats API schedule as the source of truth.
- MLB API starters use the same schedule/game_id construction.
- Games and starters now align deterministically.
- Markets are inserted with null odds from official schedule source.
- Gemini is no longer primary for games or starter names.

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Test:
CLEAN > Full
SCRAPE > Markets
SCRAPE > MLB API
CHECK > Games
CHECK > Starters
CHECK > Bad Start
CHECK > Stats Missing
CHECK > Truth Audit
SCRAPE > FULL RUN
CHECK > Truth Audit
