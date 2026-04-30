AlphaDog v1.3.14 - Phase 3A/B Scheduler Dispatcher Fix

Base: v1.3.13 Sleeper Ingest + Phase 3A/B Scheduler Merge.

Fix:
- Minute cron now prioritizes due Phase 3A/3B deferred requests before static/incremental minute work.
- Fixes phase3ab_daily_4am rows staying PENDING while manual Run Full Run Tick still works.
- Keeps build-first queue behavior.
- Keeps GLOBAL_PHASE3_SCHEDULED_PIPELINE no-parallel lock.
- Keeps 15-minute postpone rule.
- Keeps Sleeper RBI/RFI text ingest page/table/endpoints.

Test:
1. Deploy.
2. If a due PENDING phase3ab_daily_4am request exists, wait 2-3 minutes.
3. Run PHASE 3A/3B > Check Full Run.
4. completed_rows/result_completed should increase without manual tick.
