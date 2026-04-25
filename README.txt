AlphaDog Truth Gate Patch

Fixes:
- Duplicate starter names hard-fail FULL RUN.
- Starter validator rejects known stale pitcher/team pairs.
- Starter prompts block historical roster memory.
- Truth Audit flags stale roster pairs.

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
CHECK > Starters
CHECK > Truth Audit
