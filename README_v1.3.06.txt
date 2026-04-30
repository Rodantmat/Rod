AlphaDog v1.3.06 - Phase 3A/3B Daily Schedule Lock

Purpose:
- Keeps v1.3.05 build-first Phase 3A/3B mechanics.
- Adds real daily Phase 3A/3B schedule at 4:00 AM PDT / 11:00 UTC.
- Keeps the minute cron as the safe continuation engine.
- Adds Schedule Daily 4AM control-room action for manual verification.

Schedule:
- * * * * *       = continuation tick for due deferred jobs
- 0 11 * * *      = Phase 3A/3B daily schedule start at 4:00 AM PDT
- 45 8 * * *      = existing incremental temp refresh
- 0 8 * * 1       = existing weekly static temp refresh

Safety:
- Uses GLOBAL_PHASE3_SCHEDULED_PIPELINE lock.
- No parallel Phase 3 job starts while lock is busy.
- If lock is busy, the deferred Phase 3A/3B request is postponed 15 minutes.
- Queue build must be complete before mining starts.
- Mining remains bounded: one safe wave per tick.

Not included yet:
- RBI/RFI daily schedules.
- Phase 3C schedule.
- Final candidate scoring.

Test:
1. Deploy.
2. Optional: click PHASE 3A/3B > Schedule Daily 4AM to create a daily-style request now.
3. Minute cron or PHASE 3A/3B > Run Full Run Tick continues it.
4. Use PHASE 3A/3B > Check Full Run to monitor.
