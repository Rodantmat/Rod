AlphaDog v1.3.13 - Sleeper Ingest + Phase 3A/B Scheduler Merge

Base: v1.3.12 Sleeper Text Board Ingest.

Merged/kept:
- Sleeper text ingest page and endpoints.
- sleeper_rbi_rfi_board auto-created table.
- Phase 3A/3B daily 4AM scheduler.
- Phase 3A/3B build-first protected tick loop.
- GLOBAL_PHASE3_SCHEDULED_PIPELINE no-parallel lock.
- 15-minute postpone logic when lock is busy.
- Minute cron continuation engine.

New in v1.3.13:
- Minute-cron fallback after 11:00 UTC: if the exact 4AM cron did not create a daily Phase 3A/3B request, the minute cron creates exactly one phase3ab_daily_4am request for the slate date and advances one safe tick.
- Prevents duplicate daily requests by checking request_id LIKE phase3ab_daily_4am|slate_date|%.

No final scoring changes. No RBI/RFI schedule added yet.
