AlphaDog MLB Lineups Patch

What changed:
- Adds MLB API lineups layer.
- New job: scrape_lineups_mlb_api
- Control Room:
  SCRAPE > MLB Lineups
  CHECK > Lineups
  CHECK > Lineup List
- FULL RUN now attempts MLB API Lineups after bullpens.
- Lineups are non-blocking because official lineups may not be posted early.
- This keeps Gemini out of raw lineup/player identity data.

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
CHECK > Games
CHECK > Starters
CHECK > Bullpen
CHECK > Lineups
CHECK > Lineup List
CHECK > Truth Audit
CHECK > Scheduler Log
