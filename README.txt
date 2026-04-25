AlphaDog Players Chunked Safe-Safe Patch

Root cause:
- One MLB Players job writes roughly 500 rows.
- D1 write calls can hit Cloudflare per-invocation API request limits.

Fix:
- MLB Players is now split into 3 safe chunks:
  SCRAPE > MLB Players G1
  SCRAPE > MLB Players G2
  SCRAPE > MLB Players G3
- Each group fetches about 10 teams and writes under a safe cap.
- FULL RUN remains clean and stable.
- Adds CHECK > Player Job Log.

Correct workflow:
1. CLEAN > Full
2. SCRAPE > FULL RUN
3. CHECK > Final Feed Audit
4. SCRAPE > MLB Players G1
5. SCRAPE > MLB Players G2
6. SCRAPE > MLB Players G3
7. CHECK > Players
8. CHECK > Handedness Gaps
9. CHECK > Player Job Log
10. CHECK > Final Feed Audit

No migration required.
Do not replace config.txt.
