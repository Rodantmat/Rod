AlphaDog/OXYGEN-COBALT Production Scheduled Backend
Build: v1.5.05.7 - PrizePicks Scraper Progress Ledger

Surgical changes only:
- Added prizepicks_scraper_runs progress ledger.
- Worker /prizepicks/scraper/status now writes both mlb_stats_refresh_audit and prizepicks_scraper_runs.
- main.py now writes step-by-step D1 progress: started, fetching, fetched, temp prep, temp staging chunks, certification, promotion, completion, failure.
- Orchestrator reads scraper progress before relying on GitHub run visibility.
- Worker creates a dispatching/dispatched progress row immediately when it calls GitHub dispatch, so no silent gap remains.
- GitHub workflow has a safe concurrency group for scraper runs.

Not changed:
- Existing scoring math.
- Existing main board scoring/candidate tables.
- Existing incremental no-delta terminal success logic.
- Existing single-lane orchestrator architecture.
