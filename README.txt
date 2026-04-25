AlphaDog MLB API Starters Patch

Major architecture change:
- Gemini is no longer the primary starter name source.
- Starters now sync from MLB Stats API:
  https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=YYYY-MM-DD&hydrate=probablePitcher(...)
- Gemini missing repair remains fallback only.
- FULL RUN now uses MLB API starter sync after markets.

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Test:
CLEAN > Full
SCRAPE > Markets
SCRAPE > MLB API
CHECK > Starters
CHECK > Truth Audit
SCRAPE > FULL RUN
CHECK > Starters
CHECK > Truth Audit
