AlphaDog MLB Stats Enrichment Patch

What changed:
- MLB API starter sync now also calls MLB People endpoint for season pitching stats.
- Attempts to fill ERA, WHIP, strikeouts, innings pitched, walks, hits allowed, HR allowed.
- Names remain hard truth from MLB API.
- Missing stats remain soft/non-blocking.

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
CHECK > Stats Missing
CHECK > Bad Start
CHECK > Truth Audit
CHECK > Scheduler Log
