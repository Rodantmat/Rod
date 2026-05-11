AlphaDog v1.5.07.4 - Cascade Eligibility Gate

Patch scope:
- Fixes false stale_pending_null_run_after_recovered failures for downstream cascade rows.
- Pending rows are now judged by true eligibility time, not original cascade enqueue created_at.
- Pending downstream rows waiting on upstream active jobs are skipped, not failed.
- If a required upstream dependency failed, dependent rows are blocked instead of silently running.
- Eligible stale pending rows are requeued, not hard-failed.
- Preserves bounded Everyday Phase 1 continuation behavior from the prior build.

Primary target:
Production scheduled backend only. No Main UI scoring math changes.
