AlphaDog v1.5.04.9 - Stale Cleanser Runtime Sharpener

Patch focus:
- Sharpens the single-lane stale run cleanser.
- Cancels old non-current pending queue rows that are no longer the active request for their job.
- Releases stale active enqueue locks when their queue row is gone/terminal or exceeds dynamic runtime.
- Fixes runtime sampling so completed queue rows are parsed in JavaScript instead of relying on SQLite timestamp math only.
- Adds PrizePicks Board runtime sampling from mlb_stats_refresh_audit when available.
- Applies dynamic successful-runtime + 20% timeout to PrizePicks Board instead of a fixed 10-check/660-second guess.
- Keeps auto_continue_scheduled / waiting states out of queue.error for non-terminal partial states.

Test sequence:
1. Deploy this flat ZIP to the scheduled backend worker.
2. Open Control Room.
3. Run DATA REFRESHING > Orchestrator Status.
4. Confirm version shows v1.5.04.9 - Stale Cleanser Runtime Sharpener.
5. Confirm runtime_profiles now has non-zero sample_count for jobs with completed queue rows; PrizePicks Board should use queue samples and/or mlb_stats_refresh_audit samples when present.
6. Confirm old non-current pending rows such as prior-date incremental rows are cancelled by the cleanup pass.
7. Run/allow PrizePicks Board and confirm waiting output includes dynamic_timeout_seconds/runtime_profile instead of fixed max_cron_checks timeout logic.
