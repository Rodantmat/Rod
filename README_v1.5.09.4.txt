AlphaDog / OXYGEN-COBALT
v1.5.09.4 - Durable Retry Clean Publish Gate

Purpose
- Patch v1.5.09.3 without changing scoring math, UI layout, PrizePicks scraping, Phase 1, Weather/Roof, Lineup/Scratch, Phase 2C-I market context, or Main UI.
- Make the 1 PM / intraday cascade safer and repeatable across multiple daily runs.

Changes
1. Retryable D1/network scoring failures no longer finalize as failed half-runs.
   - Errors such as D1_ERROR: Network connection lost are treated as retryable when scoring is queue-owned.
   - The scoring run remains RUNNING with its durable checkpoint preserved.
   - The queue row returns partial_continue so the next minute tick resumes instead of publishing stale candidates or leaving failed partial debris.

2. Non-retryable SQL/code errors still fail safely.
   - SQLITE_AUTH, no such column/table, syntax errors, constraint errors, and similar hard failures are not hidden as retries.
   - These still finalize as failed for visibility.

3. Downstream queue release is now repeatable after terminal stages.
   - On a completed stage, the next pending downstream queue row in the same chain is automatically given run_after=CURRENT_TIMESTAMP if needed.
   - On an optional failed stage with no blocked dependents, the next pending downstream queue row is also released.
   - Required failures still block dependents.

4. Candidate board publish safety is preserved.
   - Candidate board rebuild still runs only after scoring completes with data_ok=true.
   - Partial scoring retries cannot overwrite score_candidate_board.

5. Version labels updated consistently.
   - worker.js SYSTEM_VERSION
   - control_room.html visible version
   - README
   - BUILD_VERSION_AUDIT

Deployment
- Deploy this ZIP as the production scheduled backend/control-room worker only.
- Do not deploy this to Main UI.
- Do not mix with expansion worker or POTD worker.

Test sequence after deploy
1. DATA REFRESHING > Production Clock Orchestrator > Check Status
2. MANUAL SQL: verify no open queue rows
3. Wait for next scheduled or enqueue a controlled cascade only if needed
4. During scoring, inspect queue rows; D1 network drops should show partial/retry, not failed finalization
5. After completion, inspect score_candidate_board freshness

Important expected behavior
- D1 network blips should retry.
- SQL syntax/auth/schema errors should not retry blindly.
- No old candidate board should be published from partial scoring.
- Next queued stage should not sit forever with run_after NULL after upstream terminal completion.
