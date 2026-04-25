AlphaDog Recent Usage Patch

What changed:
- Adds MLB API recent usage layer using existing player_recent_usage table.
- No migration required.
- New job: scrape_recent_usage_mlb_api
- Uses previous-day completed boxscores only.
- Pulls batter-level previous-game AB, hits, lineup slot.
- Control Room buttons:
  SCRAPE > MLB Usage
  CHECK > Usage
  CHECK > Usage List
- Easy re-attack cleanup:
  Bad Start query no longer treats official MLB API stat gaps as bad starts.

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
