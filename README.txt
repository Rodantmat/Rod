AlphaDog MLB Bullpen D1 Fix

Fix:
- bullpens_current does not have a matching UNIQUE constraint for ON CONFLICT(game_id, team_id).
- This patch changes bullpens_current writes to delete+insert mode.
- No schema migration required.

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Test:
CLEAN > Full
SCRAPE > FULL RUN
CHECK > Bullpen
CHECK > Bullpen List
CHECK > Truth Audit
CHECK > Scheduler Log
