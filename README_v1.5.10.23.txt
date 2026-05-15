AlphaDog / OXYGEN-COBALT
v1.5.10.23 - Everyday Phase 1 State Machine Rebuild Gate

Purpose
- Rebuilds Everyday Phase 1 as a real state machine instead of chasing one-off hangs.
- Preserves the working incremental delta/orchestrator mechanics.
- Fixes lineups cursor persistence by storing compact progress at the top of the child output payload.
- Prevents fake clean success: missing required certified output stays waiting or fails certification, it does not complete.
- Clears finished_at whenever a queue row is re-opened as pending. Active queue rows must never keep finished_at.
- Keeps parent queue request_id bound to everyday_phase1_runs.request_id.
- Removes PrizePicks board as an Everyday Phase 1 certification dependency; PrizePicks board remains its own later phase.

Expected behavior
- No slate: completed/no-actionable, clean release.
- Full slate with lineups posted: advances through lineups, usage, candidates, completes.
- Full slate before lineups posted: remains pending/waiting_external_data on lineups, no fake success, no downstream release.
- Split slate: mines posted/current pickable games, keeps waiting only for missing pickable lineups.
- Run-after-run: stale child rows are cancelled, bound child row owns state, cursor does not restart at the first two games forever.
- Connector/schema failure: hard fail and blocks downstream.
- Certification failure: hard fail and blocks downstream.

Deploy
Upload the flat files from this ZIP to the scheduled backend worker only. Do not use for Main UI.
