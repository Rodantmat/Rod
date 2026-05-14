AlphaDog / OXYGEN-COBALT
v1.5.10.9 - Incremental DB Capsule Restore Gate

Patch target:
- Fixes incremental_daily failing inside refresh_orchestrator_tick with: Cannot read properties of undefined (reading 'DB').

Root cause fixed:
- The orchestrator special incremental branch called runIncrementalTempAutoLoop(input) without passing env.
- runIncrementalTempAutoLoop immediately calls ensureIncrementalTempTables(env), so env was undefined and env.DB crashed before the incremental child could stage temp rows.

Changes:
- runRefreshOrchestratorTick now calls runIncrementalTempAutoLoop(..., env) for incremental_daily.
- getIncrementalDeltaWindowProgress no longer references undefined heartbeatRequestId/startDate/endDate variables in the schedule-fetch visibility event.
- SYSTEM_VERSION label synchronized to v1.5.10.9 - Incremental DB Capsule Restore Gate.

Protected:
- Real data tables are not wiped.
- Logs are not wiped.
- Killer Cleaner remains hard-reset only for orchestrator/cron execution state.

Test sequence:
1. DATA REFRESHING > Killer Cleaner
2. DATA REFRESHING > Schedule Selected Only with only 01 Incremental Daily Delta selected
3. Wait 2-3 cron ticks
4. Run SQL commands from chat response, not from this README.
