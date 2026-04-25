AlphaDog Cron + Log Phase

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Cloudflare cron trigger to add:
*/30 * * * *

What changed:
- Cloudflare scheduled event runs run_full_pipeline automatically.
- Manual FULL RUN is logged to task_runs.
- Scheduled FULL RUN is logged to task_runs.
- Control Room added:
  CHECK > Scheduler Log
  CHECK > Failed Runs
  CHECK > Stats Missing

Test after deploy:
DEBUG > Health
SCRAPE > FULL RUN
CHECK > Scheduler Log
CHECK > Failed Runs
CHECK > Truth Audit

Cron test:
After adding the cron trigger, wait for the next 30-minute mark, then run:
CHECK > Scheduler Log
