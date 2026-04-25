AlphaDog Cron Log Buttons Fix

Fix:
- Forces CHECK > Scheduler Log button.
- Forces CHECK > Failed Runs button.
- Forces CHECK > Stats Missing button.
- Adds SQL functions even if previous regex failed.

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Test:
DEBUG > Config
CHECK > Scheduler Log
CHECK > Failed Runs
CHECK > Stats Missing
CHECK > Truth Audit
