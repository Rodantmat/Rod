AlphaDog v1.5.10.14 - Selected Pending Immediate Pickup Gate

Patch purpose:
This build fixes the confirmed rerun failure in v1.5.10.13 where Schedule Selected Only created an incremental_daily queue row with:
- status = pending
- tick_count = 0
- run_after = NULL
- started_at = NULL
- output_json = NULL

That row stayed dead instead of being picked up by minute cron.

Root-cause fix:
1. Schedule Selected Only now inserts selected/manual queue rows with run_after = CURRENT_TIMESTAMP, never NULL.
2. The queue insert writes an output_json proof marker: selected_pending_immediate_pickup.
3. Tick preflight repairs any selected/manual pending row with run_after NULL before start.
4. Single-lane cleanup repairs selected/manual pending NULL-run_after rows that have no upstream active predecessor.
5. Same-request active enqueue locks are explicitly allowed and logged as same_request_enqueue_lock_allowed.
6. Repair events are logged as selected_pending_null_run_after_repaired.

Expected behavior after deploy:
- Killer Cleaner should show v1.5.10.14.
- Schedule Selected Only should show v1.5.10.14.
- The newest incremental_daily queue row should have run_after populated immediately.
- Within the next cron pickup, tick_count should become 1+ and started_at should populate.
- The queue row must not sit pending forever with run_after NULL.

Exact test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Run: DATA REFRESHING > Killer Cleaner.
4. Run: DATA REFRESHING > Schedule Selected Only with only 01 Incremental Daily Delta selected.
5. Immediately run Manual SQL:

SELECT
  request_id,
  chain_id,
  job_key,
  status,
  tick_count,
  run_after,
  created_at,
  started_at,
  finished_at,
  updated_at,
  error,
  substr(output_json,1,8000) AS output_preview
FROM data_refresh_queue
WHERE job_key = 'incremental_daily'
ORDER BY datetime(created_at) DESC
LIMIT 5;

PASS condition:
- newest row status is pending/running
- newest row run_after is NOT NULL
- output_preview includes selected_pending_immediate_pickup if still pending

6. After one minute cron tick, run the same SQL again.

PASS condition:
- newest row tick_count is 1+
- started_at is populated if running or already advanced
- output_preview includes queue_tick_started OR auto_continue_scheduled OR completed evidence

7. Run Manual SQL:

SELECT
  created_at,
  event_type,
  status,
  message,
  substr(payload_json,1,8000) AS payload_preview
FROM data_refresh_events
WHERE created_at >= datetime('now','-10 minutes')
  AND (
    event_type IN ('selected_pending_immediate_pickup','selected_pending_null_run_after_repaired','same_request_enqueue_lock_allowed')
    OR payload_json LIKE '%selected_pending_immediate_pickup%'
    OR payload_json LIKE '%selected_pending_null_run_after_repaired%'
    OR payload_json LIKE '%same_request_enqueue_lock_allowed%'
  )
ORDER BY datetime(created_at) DESC
LIMIT 50;

PASS condition:
- selected_pending_immediate_pickup appears after Schedule Selected Only.
- selected_pending_null_run_after_repaired should only appear if a legacy/bad NULL row existed.
- same_request_enqueue_lock_allowed should appear when the active enqueue lock belongs to the same picked-up request.

Protected tables not wiped by this patch:
- score_candidate_board
- prizepicks_current_market_context
- odds_api_events
- odds_api_game_markets
- odds_api_player_props
- games
- markets_current
- starters_current
- lineups_current
- incremental_player_metrics
- player_game_logs
- ref_player_splits
- data_refresh_events
- data_orchestrator_logs

Files changed:
- worker.js
- control_room.html version label only
- main.py version label only
- README_v1.5.10.14.txt
- BUILD_VERSION_AUDIT_v1.5.10.14.txt
