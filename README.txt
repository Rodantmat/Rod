AlphaDog Final Feed Audit Patch

What changed:
- Adds CHECK > Final Feed Audit.
- Cleans Bad Start so official MLB API soft stat gaps are not treated as hard bad starters.
- No migration required.
- No logic drift.

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
CHECK > Final Feed Audit
CHECK > Bad Start
CHECK > Truth Audit
CHECK > Scheduler Log

Pass target:
- FULL RUN = success
- Final Feed Audit hard checks = PASS
- Bad Start = empty or only true hard rows
- Truth Audit = clean
