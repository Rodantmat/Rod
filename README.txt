AlphaDog Scheduler FK Fix 2

Root cause:
Markets were still allowed through if Gemini returned zero valid game rows but nonzero market rows.
That caused markets_current to insert game_ids that did not exist in games.

Fix:
markets_current rows are now ALWAYS filtered against the valid games returned in the same Gemini payload.
If games are rejected/empty, markets insert count becomes 0 instead of causing a foreign-key crash.

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Test:
DEBUG > Health
CLEAN > Full
SCRAPE > Markets
CHECK > Games
CHECK > Markets
