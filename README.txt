AlphaDog Derived Context Manual Safe-Safe Limit Fix

Root fix:
- FULL RUN no longer calls Derived Metrics inside the same Worker invocation.
- This prevents Cloudflare "Too many API requests by single Worker invocation" failures.
- Derived Metrics remains available as a separate Control Room button/job.

Why:
The feed pipeline is already near the Cloudflare per-invocation D1/API request ceiling.
Derived Metrics performs extra D1 reads/writes and must run as its own separate scheduled/manual task.

Run order:
1. CLEAN > Full
2. SCRAPE > FULL RUN
3. SCRAPE > Run Derived Metrics
4. CHECK > Derived Metrics
5. CHECK > Park Context Audit
6. CHECK > Feed Readiness
7. CHECK > Final Feed Audit

No migration required.
Do not replace config.txt.
