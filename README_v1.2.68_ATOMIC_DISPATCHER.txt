AlphaDog v1.2.68 - Atomic Dispatcher

Surgical patch purpose:
- Stop duplicate FULL RUN invocations from creating Cloudflare subrequest storms.
- Make SCRAPE > FULL RUN a lightweight dispatcher only.
- Keep heavy raw mining in SCRAPE > Board Queue Auto Mine Raw / scheduled miner.
- Reset stale running FULL RUN rows and stale queue RUNNING rows before lock acquisition.
- Return LOCKED / RETRY_LATER / PARTIAL_OK style 200 responses for expected continuation states instead of letting the UI retry into duplicates.

Changed files:
- worker.js

Core changes:
1. SYSTEM_VERSION is now v1.2.68 - Atomic Dispatcher.
2. FULL RUN now uses one global FULL_PIPELINE lock instead of slate-specific lock IDs.
3. FULL RUN now calls resetStalePipelineRuntime before acquiring lock.
4. FULL RUN no longer runs starter fallback, lineup scrape, bullpen scrape, or raw mining waves.
5. FULL RUN only refreshes games/markets and materializes board_factor_queue.
6. Auto mining batch limit reduced from 8 to 5 rows per invocation for Cloudflare subrequest safety.
7. If FULL RUN catches a non-fatal exception, it returns PARTIAL_OK_EXCEPTION_CAPTURED instead of encouraging browser retries.
8. Mining remains independent from FULL_PIPELINE lock.

Expected behavior:
- SCRAPE > FULL RUN should return fast.
- If another full pipeline is active, response should be status LOCKED, not a failure.
- Queue mining progress should come from SCRAPE > Board Queue Auto Mine Raw and scheduled miner, not FULL RUN.
- Old stuck run_full_pipeline task rows older than 15 minutes should reset to stale_reset on the next full run.

Primary test sequence:
1. DEBUG > Health
   Expected: version v1.2.68 - Atomic Dispatcher.

2. CHECK > Scheduler Log
   Expected: old stuck running rows may still show before a new FULL RUN.

3. SCRAPE > FULL RUN
   Expected: fast response, no TypeError Load failed, no Too many API requests. Status should be PASS, RETRY_LATER, PARTIAL_OK, or LOCKED. RETRY_LATER is acceptable if queue rows remain.

4. CHECK > Scheduler Log
   Expected: latest run_full_pipeline finished instead of staying running. Older stuck rows should move to stale_reset after stale recovery if older than 15 minutes.

5. CHECK > Board Queue Health
   Expected: queue remains stateful. Pending rows are normal continuation work.

6. SCRAPE > Board Queue Auto Mine Raw
   Expected: mines up to 5 rows per invocation, no full-run lock conflict.

7. CHECK > Board Factor Results
   Expected: result_rows increases after miner runs.

Important:
This build intentionally does not solve missing starters inside FULL RUN. Missing/TBD starters are warning-state continuation data. The dedicated Missing starter button/cron remains the correct repair path.
