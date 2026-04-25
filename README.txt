AlphaDog FULL RUN Limit Hard Fix

Problem:
- FULL RUN still exceeded the Cloudflare per-invocation API/D1 request limit.

Root fix:
- FULL RUN is now lean/core only:
  1. Clean slate
  2. Games/Markets
  3. Starters
  4. Bullpens

Heavy/non-core layers must stay as separate buttons/jobs:
- Run Lineups
- Run Recent Usage
- MLB Players G1-G6
- Run Derived Metrics

Correct run order:
1. SCRAPE > FULL RUN
2. SCRAPE > Run Lineups
3. SCRAPE > Run Recent Usage
4. SCRAPE > MLB Players G1
5. SCRAPE > MLB Players G2
6. SCRAPE > MLB Players G3
7. SCRAPE > MLB Players G4
8. SCRAPE > MLB Players G5
9. SCRAPE > MLB Players G6
10. SCRAPE > Run Derived Metrics
11. CHECK > Final Feed Audit
12. CHECK > Feed Readiness
13. CHECK > Scheduler Log

No migration required.
Do not replace config.txt.
