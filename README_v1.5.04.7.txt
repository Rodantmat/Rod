AlphaDog v1.5.04.7 - Incremental Continue Lock Release Gate

Patched from v1.5.04.6.

Root fixes:
- Keeps v1.5.04.6 duplicate/zombie cleanup behavior.
- Adds immediate recovery when incremental_daily global lock is still RUNNING but its queue row is already pending with auto_continue_scheduled/partial_continue.
- Reorders partial handling so non-PrizePicks jobs release the global lock before queue requeue writes.
- Sets pending partial queue rows back to started_at=NULL so status output no longer looks running+pending at the same time.
- Reduces orchestrated incremental ticks to one bounded micro-tick per cron pass to avoid long Worker request lifetimes trapping the lock.

Do not run cascade first. Run the test sequence from the response exactly.
