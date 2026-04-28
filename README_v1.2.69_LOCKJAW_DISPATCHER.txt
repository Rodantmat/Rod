AlphaDog / OXYGEN-COBALT v1.2.69 - Lockjaw Dispatcher
Target Worker: alphadog-phase3-starter-groups

Purpose:
Surgical reliability patch based on v1.2.68 fixed / work68_fixed_oai.

Changed scope:
1. Version bumped to v1.2.69 - Lockjaw Dispatcher.
2. Control room endpoint now targets alphadog-phase3-starter-groups.
3. Scheduler is split/lightened internally: each cron routes to one bounded job only.
4. FULL_PIPELINE lock is slate-scoped: FULL_PIPELINE|YYYY-MM-DD.
5. Auto Miner lock remains independent: BOARD_QUEUE_AUTO_MINE|YYYY-MM-DD.
6. Stale RUNNING task/lock/queue recovery hardened.
7. starters_current receives safe data_source compatibility column if missing.
8. Starter overwrite protection added: blank/TBD/unknown API rows cannot overwrite valid manual/fallback/official rows.
9. Auto Miner selects the under-mined family with the fewest completed result queues, one family per invocation.
10. Canonical future result writes use one deterministic result_id per queue_id: <queue_id>|RESULT.
11. Old duplicate result rows are preserved for audit; no destructive cleanup is auto-run.

Hard exclusions:
- No scoring.
- No UI redesign.
- No new factor expansion.
- No old ZIP merge.
- No destructive duplicate cleanup.

After deploy test order:
1. DEBUG > Health. Expected version: v1.2.69 - Lockjaw Dispatcher. Expected worker: alphadog-phase3-starter-groups.
2. Manual SQL: PRAGMA table_info(starters_current); confirm data_source exists or was added.
3. Manual SQL: SELECT * FROM pipeline_locks ORDER BY lock_id LIMIT 50;
4. SCRAPE > FULL RUN once. Expected HTTP 200 and fast dispatcher response.
5. CHECK > Board Queue Health.
6. SCRAPE > Board Queue Auto Mine Raw once. Expected selected_queue_type to favor under-mined families.
7. CHECK > Board Factor Results.
8. Duplicate check: existing duplicates may remain, but new duplicates should not increase for newly mined rows.
