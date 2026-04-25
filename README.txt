AlphaDog Scheduler FK Fix

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Do not replace config.txt.

Fixes:
- Removes duplicate FULL RUN button.
- FULL RUN cleans the resolved slate before starting.
- Markets rows are filtered so only game_ids inserted into games can be inserted into markets_current.
- Prevents foreign-key failure caused by Gemini returning markets for games rejected from games validation.

Test:
DEBUG > Health
DEBUG > Config
CLEAN > Full
SCRAPE > Markets
CHECK > Games
CHECK > Markets
SCRAPE > FULL RUN
CHECK > Starters
CHECK > Truth Audit
