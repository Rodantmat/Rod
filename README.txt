AlphaDog MLB Bullpen Fatigue Patch

What changed:
- Adds MLB API bullpen fatigue layer.
- New job: scrape_bullpens_mlb_api
- Control Room: SCRAPE > MLB Bullpen
- Control Room: CHECK > Bullpen
- Control Room: CHECK > Bullpen List
- FULL RUN now includes MLB API Bullpens.
- Bullpen usage uses previous completed games boxscores.
- last_game_ip and last3_ip are calculated from reliever innings.
- fatigue is low / medium / high.

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
CHECK > Bullpen List
CHECK > Truth Audit
CHECK > Scheduler Log
