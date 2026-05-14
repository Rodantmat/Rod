AlphaDog v1.5.10.8 - Incremental Preflight Visibility Gate

Patch scope: production scheduled backend worker/control room package.

Changes:
- Adds pre-hard-reconcile heartbeat for incremental child ticks.
- Adds pre-mode and schedule-fetch visibility events for stage_delta_logs.
- Passes active incremental_temp_refresh_runs.request_id explicitly into stage_delta_logs.
- Adds orchestrator soft timeout around incremental child tick so the parent queue cannot stay stuck silently.
- Overwrites queue_tick_started output_json so deployed version/status is visible instead of stale COALESCE output.

Protected: real data tables, scoring math, PrizePicks logic, Odds API logic, Main UI scoring board.
