AlphaDog Scheduler Retry Fix

Fixes:
- FULL RUN now retries Markets internally up to 3 times until games > 0.
- FULL RUN no longer stops after a single 0/0 markets response.
- Control Room final status is clearer when HTTP/body is failed.

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
SCRAPE > FULL RUN
CHECK > Games
CHECK > Starters
CHECK > Truth Audit
