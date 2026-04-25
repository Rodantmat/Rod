AlphaDog MLB API Names-First Patch

Fix:
- Official MLB Stats API probable pitcher rows now insert even if stats are null.
- Missing stats are non-blocking for official MLB API rows.
- Bad Start no longer flags official MLB API rows only because stats are missing.
- Added CHECK > Stats Missing as a separate soft enrichment check.
- FULL RUN success is name/truth based first.

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
CHECK > Bad Start
CHECK > Stats Missing
CHECK > Truth Audit
SCRAPE > FULL RUN
CHECK > Starters
CHECK > Truth Audit
