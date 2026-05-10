Build: v1.5.05.8 - PrizePicks Ledger Installer Guard

Surgical fix from v1.5.05.7:
- Adds Worker-owned installer route /prizepicks/scraper/install.
- Adds Control Room button: DATA REFRESHING > Install PP Ledger.
- Orchestrator init now creates/verifies prizepicks_scraper_runs automatically.
- PrizePicks Board trigger verifies the ledger before waiting for scraper progress.
- Manual SQL still blocks DDL by design; do not use CREATE TABLE in Manual SQL.
- No scoring math, candidate board logic, static/incremental logic, or production cascade order was changed.

Required test order:
1. Deploy Worker and GitHub files.
2. In Control Room, press DATA REFRESHING > Install PP Ledger.
3. Run Manual SQL: PRAGMA table_info(prizepicks_scraper_runs)
4. Run Manual SQL: SELECT run_id, dispatch_id, status, step, progress_message, rows_main, error_message, updated_at FROM prizepicks_scraper_runs ORDER BY datetime(updated_at) DESC LIMIT 10
5. Press DATA REFRESHING > PrizePicks Board Only.
6. Press DATA REFRESHING > Orchestrator Status after each cron tick.
