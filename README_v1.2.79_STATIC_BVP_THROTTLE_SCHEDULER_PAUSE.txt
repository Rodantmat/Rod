AlphaDog v1.2.79 - Static BvP Throttle + Scheduler Pause

Purpose:
- Patch BvP current-slate scrape after v1.2.78 hit Cloudflare subrequest limits and falsely returned pass.
- Pause scheduled backend tasks so freshly mined static tables are not mutated by cron while static foundation validation continues.

Changes:
- BvP Current Slate now uses resumable 5-pair batches.
- BvP returns partial_continue until remaining_pairs_after is 0.
- BvP no longer wipes slate BvP rows on every click; it wipes only on a fresh slate start with no BvP progress.
- Same-job running guard now covers Game Logs G1-G6 and BvP Slate.
- Scheduled handler is paused/no-op: no cron mining, full-run, one-shot, queue, or static-table mutation executes from scheduled events.
- Manual Control Room buttons remain enabled.

Test order:
1. Health: verify v1.2.79.
2. STATIC > Scrape BvP Current Slate once.
3. Expect batch_limit: 5 and either partial_continue/pass/empty_no_bvp_history.
4. Keep running BvP Slate until remaining_pairs_after = 0.
5. CHECK > Static BvP.
6. CHECK > All Static Data.

Note:
BvP is a sparse low-sample tiebreaker. Missing BvP history is normal and should be marked NO_DATA, not treated as a system failure.
