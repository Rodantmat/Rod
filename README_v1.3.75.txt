AlphaDog v1.3.75 - Incremental Orchestrator Adapter Repair

Surgical patch over v1.3.74.

Fixes:
1. Incremental orchestrator adapter now forces a fresh incremental request when no active pending/running incremental request exists.
2. Orchestrator no longer treats idle_no_due_temp_refresh as successful completion for a failed/incomplete incremental refresh.
3. Manual/selected Incremental Daily Temp now auto-schedules and force-dues the request for immediate safe bounded processing.
4. Stale incremental finalizer threshold changed from 30 minutes to 6 hours so legitimate long current-season MLB API refreshes are not killed mid-stage.
5. Existing queue/cascade framework preserved. No scoring math, market logic, candidate board logic, or schema redesign touched.

Deploy target:
alphadog-phase3-starter-groups

Test sequence:
1. Deploy this ZIP.
2. In Control Room, run DEBUG > Health. Confirm version v1.3.75 - Incremental Orchestrator Adapter Repair.
3. Run DATA REFRESHING > Cancel Active Queue once if old queue rows are still active.
4. Run DATA REFRESHING > Schedule Selected Only with only Incremental Daily Temp checked.
5. Wait 3-5 minutes.
6. Run DATA REFRESHING > Orchestrator Status. Confirm incremental_daily is running, not completed if still partial.
7. Run CHECK TEMP > All Incremental Temp. Confirm player_game_logs_temp keeps increasing, then later ref_player_splits_temp starts filling.
8. After completion, run CHECK > Incremental All and CERTIFY TEMP > Audit Incremental Temp.
