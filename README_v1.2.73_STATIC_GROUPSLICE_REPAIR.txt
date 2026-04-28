AlphaDog / OXYGEN-COBALT
Version: v1.2.73 - Static GroupSlice Repair

Surgical patch from v1.2.72.

Fixes:
- Restores missing groupSlice() helper used by STATIC > Scrape Players G1-G6.
- Keeps v1.2.72 static player chunk behavior.
- Keeps pitcher role mapping: primary_position=P => role=PITCHER.
- Keeps Static All Fast limited to venues + aliases only.
- Keeps Check All Static returning HTTP 200 for needs_scrape.
- Keeps TB venue override to George M. Steinbrenner Field.

Do not run Splits/Game Logs until Static Players G1-G6 and CHECK > Static Players pass.
