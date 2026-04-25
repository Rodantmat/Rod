AlphaDog Control Room Button Grid Fix

Fix:
- Removed orphan scrape buttons from the bottom of the page.
- Moved Run Lineups, Run Recent Usage, Run Derived Metrics, and MLB Players G1-G6 into the SCRAPE grid.
- FULL RUN remains lean/core only to avoid Cloudflare request limits.

Use this order:
SCRAPE > FULL RUN
SCRAPE > Run Lineups
SCRAPE > Run Recent Usage
SCRAPE > MLB Players G1
SCRAPE > MLB Players G2
SCRAPE > MLB Players G3
SCRAPE > MLB Players G4
SCRAPE > MLB Players G5
SCRAPE > MLB Players G6
SCRAPE > Run Derived Metrics
CHECK > Final Feed Audit
CHECK > Feed Readiness
CHECK > Scheduler Log

No migration required.
Do not replace config.txt.
