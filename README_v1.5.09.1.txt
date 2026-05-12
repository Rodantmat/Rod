AlphaDog/OXYGEN-COBALT
v1.5.09.1 - Odds API Certification Finalizer Gate

Patch target:
- Production scheduled backend / Control Room only.
- Surgical fix for 9 AM cascade blockage caused by Everyday Phase 1 child-run continuation/finalization.

What changed:
- Added Everyday Phase 1 child-run reconciliation before schedule/tick execution.
- Old stale everyday_phase1_runs rows are terminalized as recovered instead of remaining ghost RUNNING rows.
- Same-slate stale RUNNING child rows are requeued from current_step instead of restarting from the beginning.
- Duplicate active child rows are recovered so the newest active same-slate child owns continuation.
- Impossible status=running with finished_at IS NOT NULL rows are reconciled.
- Queue-owned Everyday Phase 1 gets a parent finalizer/reaper that can complete data_refresh_queue/data_orchestrator_jobs from a completed everyday_phase1_runs child.
- Each child step now writes an attempting_step heartbeat before executing, improving diagnostics if a request lifecycle is killed.

What was not changed:
- No scoring math changes.
- No v1.5.08.9 same-slate scoring gate changes.
- No PrizePicks board/context logic changes.
- No Odds API changes.
- No Main UI changes.
- No forced Today/Tomorrow slate; AUTO remains intact.

Expected post-deploy result:
- The stuck 9 AM chain can resume from Everyday Phase 1 candidates_hits.
- edge_candidates_hits/rbi/rfi should update for the active slate after Everyday Phase 1 completes.
- Downstream jobs 03-09 should unlock in order after Everyday Phase 1 completes.
- Old stale everyday_phase1_runs.status='running' rows should no longer remain as active ghosts.


PATCH NOTES - v1.5.09.1 - Odds API Certification Finalizer Gate
- Preserves v1.5.09.0 Everyday Phase 1 continuation fix.
- Adds Odds API Morning/Intraday locked-job continuation so the next minute tick can resume instead of waiting for dynamic timeout.
- Adds Odds API queue progress output states so odds jobs do not remain RUNNING with null output_json after start.
- Adds existing-temp-run finalizer: if Odds API temp rows exist for slate/window, certify, promote, clean, and complete without refetching.
- Does not touch scoring math, PrizePicks Board, PrizePicks Context, Main UI behavior, Everyday Phase 1 logic, or slate AUTO logic.
