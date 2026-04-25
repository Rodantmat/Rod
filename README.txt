AlphaDog Re-Attack Sweep Safe-Safe Patch

What changed:
1. Player Identity is now 6 chunks, not 3:
   - MLB Players G1 through G6
   - About 5 teams per group
   - Under D1/API request limits
   - G1 clears players_current to prevent stale carryover
2. Manual jobs now write to task_runs:
   - Player Job Log works
   - Failed Runs captures non-full jobs too
3. Added Control Room re-attack audits:
   - Market Audit
   - Lineup Freshness
   - Player Cleanliness
4. Final Feed Audit tightened:
   - Players must be >=600
   - Duplicate player/team check included
   - Handedness gaps still checked

No migration required.
Do not replace config.txt.

Test order:
1. CLEAN > Full
2. SCRAPE > FULL RUN
3. CHECK > Final Feed Audit
4. SCRAPE > MLB Players G1
5. SCRAPE > MLB Players G2
6. SCRAPE > MLB Players G3
7. SCRAPE > MLB Players G4
8. SCRAPE > MLB Players G5
9. SCRAPE > MLB Players G6
10. CHECK > Players
11. CHECK > Handedness Gaps
12. CHECK > Player Job Log
13. CHECK > Market Audit
14. CHECK > Lineup Freshness
15. CHECK > Player Cleanliness
16. CHECK > Final Feed Audit
