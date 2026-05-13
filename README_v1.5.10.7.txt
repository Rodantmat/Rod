AlphaDog / OXYGEN-COBALT
v1.5.10.7 - Incremental Delta Fetch Timeout Gate

Patch target:
- Incremental Daily Delta only.
- Prevent stage_delta_logs from heartbeat-looping silently before MLB schedule/boxscore fetches.

Changes:
1. fetchJsonWithRetry now uses AbortController timeout, default 7500ms, capped at 12000ms.
2. stageIncrementalDeltaGameLogsTemp writes a visible heartbeat before MLB schedule fetch.
3. stageIncrementalDeltaGameLogsTemp writes a visible failure heartbeat if schedule fetch fails/times out.
4. runIncrementalTempScheduledTick passes the active child request_id into stage_delta_logs so heartbeats always update the correct incremental_temp_refresh_runs row.

Protected:
- Real data tables are not wiped.
- Scoring math untouched.
- PrizePicks untouched.
- Odds API untouched.
- Main UI untouched.

Test sequence is in the chat response, not only here.
