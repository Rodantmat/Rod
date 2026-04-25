AlphaDog Recent Usage Schema-Safe Fix

Root cause:
- Existing player_recent_usage table has no source/confidence columns.
- Previous patch tried to write source/confidence and crashed.

Fix:
- Uses existing player_recent_usage schema only.
- Writes:
  player_name, team_id, last_game_ab, last_game_hits, lineup_slot
- No migration required.

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
CHECK > Usage
CHECK > Usage List
CHECK > Bad Start
CHECK > Truth Audit
CHECK > Scheduler Log
