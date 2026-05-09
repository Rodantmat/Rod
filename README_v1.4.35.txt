AlphaDog v1.4.35 - External-Failure Self-Healing Orchestrator

Purpose:
- Make the production refresh pipeline self-sufficient instead of manual-SQL dependent.
- Treat duplicate clock chains, stale partial_continue rows, orphan pending rows, stale non-scoring running rows, optional Odds API failures, and stale scoring blockers as auto-healable logic problems.
- Keep true terminal failure reserved for real external service outages: Cloudflare, GitHub, Odds API, or Gemini.

Key fixes:
1. Adds refresh_orchestrator_self_heal preflight.
2. Cancels duplicate scheduled clock chains for the same slot/date automatically.
3. Requeues stale partial_continue Phase 2C rows automatically.
4. Requeues stale non-scoring running rows automatically.
5. Releases orphan pending rows when their predecessor is no longer active.
6. Releases downstream scoring after optional Odds API failure instead of trapping the chain.
7. Unifies Odds API key diagnostics around getOddsApiKey(env) and includes resolver details in health/job outputs.
8. Schedule enqueue remains fast: no scoring/mining/purge inside browser request.

Test sequence:
1. Deploy this flat ZIP.
2. Control Room > DEBUG > Health.
3. Confirm version is v1.4.35 - External-Failure Self-Healing Orchestrator.
4. Control Room > DATA REFRESHING > Schedule Cascade.
5. Wait 3-5 minutes, then run Manual SQL active queue check:
   SELECT request_id, chain_id, job_key, status, error, started_at, finished_at, updated_at FROM data_refresh_queue WHERE status IN ('pending','running') ORDER BY updated_at DESC LIMIT 20;
6. If Phase 2C shows partial_continue and stops updating, wait for the next minute tick. v1.4.35 should requeue it automatically.
7. After scoring, verify candidate board:
   SELECT slate_date, candidate_status, prop_family, COUNT(*) AS rows_count, MAX(updated_at) AS newest_updated_at FROM score_candidate_board GROUP BY slate_date, candidate_status, prop_family ORDER BY slate_date DESC, candidate_status, prop_family;

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.4.35.txt
- BUILD_VERSION_AUDIT_v1.4.35.txt
