AlphaDog / OXYGEN-COBALT
v1.2.72 - Static Players Chunk Repair

Purpose:
- Fix static player scrape subrequest limit by adding Players G1-G6 chunk jobs.
- Fix ref_players role classification so primary_position P stores role=PITCHER, not BATTER.
- Make CHECK > All Static Data return HTTP 200 with status=needs_scrape for normal incomplete static tables.
- Force controlled TB venue override to George M. Steinbrenner Field for the static venue table.

Test order:
1. DEBUG > Health. Confirm v1.2.72 - Static Players Chunk Repair.
2. STATIC > Scrape All Fast. Expected: venues + aliases only; players intentionally skipped.
3. STATIC > Scrape Players G1, then G2, G3, G4, G5, G6 in order.
   - G1 wipes ref_players.
   - G2-G6 append.
   - Expected: 10-25 seconds per group.
4. CHECK > Static Players. Expected: fuller player count and pitchers stored as role=PITCHER.
5. CHECK > All Static Data. Expected: HTTP 200. It may show status=needs_scrape until splits, logs, and BvP are filled.

Do not run Splits/Game Logs until players are complete.
