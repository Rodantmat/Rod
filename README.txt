AlphaDog Daily Slate Prompt Fix

Fix:
- Markets prompt now asks for FULL SCHEDULED slate for resolved slate date.
- It no longer asks for only active/upcoming betting slate.
- It requires games even when odds are unavailable.
- It keeps market values null when unknown.
- It keeps exact database schema fields.

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
CHECK > Games
CHECK > Markets
SCRAPE > FULL RUN
CHECK > Starters
CHECK > Truth Audit
