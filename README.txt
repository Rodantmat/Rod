AlphaDog Player Identity Request-Limit Safe Fix

Root cause:
- Player Identity inserted too many player rows inside FULL RUN.
- Combined with games/starters/bullpens/lineups/recent usage/task logging, Cloudflare hit the per-invocation request limit.

Fix:
- Removes Player Identity from FULL RUN.
- Keeps SCRAPE > MLB Players Separate as its own manual/scheduled job.
- Keeps CHECK > Players, Player List, Handedness Gaps.
- FULL RUN returns to stable scheduled-feed path.

Correct workflow:
1. CLEAN > Full
2. SCRAPE > FULL RUN
3. CHECK > Final Feed Audit
4. Separately, run SCRAPE > MLB Players Separate
5. CHECK > Players
6. CHECK > Handedness Gaps

No migration required.
Do not replace config.txt.
