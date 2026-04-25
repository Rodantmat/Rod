AlphaDog MLB Bullpen Lite Patch

Fix:
- Previous bullpen version exceeded Cloudflare Worker subrequest limit.
- This version is subrequest-safe.
- It checks only previous day's completed games for teams on the slate.
- It fills last_game_ip and fatigue.
- last3_ip remains null for now to avoid subrequest overload.
- FULL RUN includes bullpen lite safely.

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
