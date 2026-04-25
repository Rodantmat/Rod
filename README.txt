AlphaDog Lineup Buttons Fix

Fix:
- Forces SCRAPE > MLB Lineups button.
- Forces CHECK > Lineups button.
- Forces CHECK > Lineup List button.
- Adds checkLineups() and listLineups() functions if missing.

Current result is healthy:
- FULL RUN success
- lineups_total = 0 is acceptable before official lineups are posted
- lineups are non-blocking by design

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Test:
DEBUG > Config
CHECK > Lineups
CHECK > Lineup List
SCRAPE > MLB Lineups
CHECK > Scheduler Log
