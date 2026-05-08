AlphaDog/OXYGEN-COBALT v1.4.17 - Orchestrator Scoring Ownership Fix

Surgical production scheduled-backend patch only.

What changed:
- Preserves v1.4.16 health/secret visibility and production clock watchdog guard.
- Fixes the orchestrator scoring row execution path so a scoring_refresh row already owned by DATA REFRESHING > Production Clock Orchestrator is passed with backend_orchestrator/orchestrator_internal ownership flags.
- This prevents the scoring row from calling enqueueBackendScoringRefresh against itself and returning scoring_already_queued_or_running forever.

What did not change:
- No scoring math changes.
- No Main UI changes.
- No expansion/xp changes.
- Same worker, routes, URLs, wrangler config, and structure.

Required test sequence:
1. Deploy this package.
2. Run DEBUG > Health. Confirm version v1.4.17 - Orchestrator Scoring Ownership Fix and all key bindings true.
3. Run DATA REFRESHING > Production Clock Status.
4. Wait one minute or run the normal orchestrator tick/status path.
5. Run Manual SQL:

SELECT request_id, chain_id, job_key, display_name, status, requested_slate_date, run_after, started_at, finished_at, error, updated_at
FROM data_refresh_queue
WHERE status IN ('pending','running','retry_later')
ORDER BY created_at DESC
LIMIT 50;

Expected:
- The old May 7 scoring_refresh row should no longer loop with scoring_already_queued_or_running.
- It should either complete, fail with a real scoring error, or clear so the next production clock plan can enqueue normally.
