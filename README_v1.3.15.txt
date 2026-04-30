AlphaDog v1.3.15 - Phase 3A/B Stale Lock Recovery

Base: v1.3.14 scheduler dispatcher fix.

Fixes:
- Adds Phase 3A/B stale global lock recovery.
- GLOBAL_PHASE3_SCHEDULED_PIPELINE auto-releases if RUNNING for more than 2 minutes.
- Scheduled dispatcher resets stale Phase 3A/B lock before checking due work.
- Check Full Run also resets stale Phase 3A/B lock before reporting.
- Keeps Sleeper text ingest and Phase 3A/B 4AM scheduler.

Why:
A scheduled tick could acquire the global lock, get killed before finally/release, and leave the daily request postponed as lock-busy. This build prevents one stuck Worker invocation from freezing the Phase 3A/B daily run.

Test:
1. Deploy.
2. Wait 2-3 minutes or click PHASE 3A/3B > Check Full Run.
3. If an old RUNNING lock existed, it should become IDLE / auto-released stale Phase 3A/B lock.
4. Run PHASE 3A/3B > Schedule Daily 4AM or wait for minute cron to continue due work.
