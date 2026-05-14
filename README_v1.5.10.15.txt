AlphaDog v1.5.10.15 - Full Run Orchestrator Parity Gate

Purpose
- Re-enable the Daily Incremental Delta schedule at 1:30 AM Pacific time.
- Keep the locked v1.5.10.14 incremental delta behavior intact.
- Extend the proven queue/orchestrator continuation behavior to the full-run stages:
  everyday_phase1, weather_roof, lineup_context, prizepicks_board, prizepicks_context, odds_api_morning, odds_api_afternoon, and scoring_refresh.

Changed
1. Daily Incremental Delta schedule is force-enabled by ensureProductionRefreshScheduleTables:
   - plan_key: daily_incremental_0130_pt
   - enabled: 1
   - hour_pt: 1
   - minute_pt: 30
   - mode: selected
   - selected_job_keys_json: ["incremental_daily"]

2. Queue-owned continuation parity added for full-run stages.
   If a queued full-run stage is left behind with GLOBAL locked/running, the next minute tick re-enters the same request/chain/job instead of leaving it behind as single_lane_busy.

3. The following job keys are now treated as queue-owned continuation jobs:
   - static_weekly
   - incremental_daily
   - everyday_phase1
   - weather_roof
   - lineup_context
   - prizepicks_board
   - prizepicks_context
   - odds_api_morning
   - odds_api_afternoon
   - scoring_refresh

4. Continuation re-entry now logs data_refresh_events event_type:
   - queue_owned_continuation_reentered

Not changed
- Incremental delta staging, no-delta terminal success, parent release fuse, child refresh logic, and promotion logic are not rewritten.
- Scoring math is not changed.
- Candidate board scoring logic is not changed.
- PrizePicks scraper code is not changed.
- Main UI is not changed.

Deploy/test sequence
1. Deploy this build.
2. Open Control Room.
3. Confirm version shows:
   v1.5.10.15 - Full Run Orchestrator Parity Gate
4. Run DATA REFRESHING > Killer Cleaner one time if any previous test queue is active.
5. Run the SQL checks from the assistant response.
6. Run DATA REFRESHING > Schedule Selected Only with Incremental Daily Delta selected.
7. Confirm it either completes normally or returns completed_no_delta_needed.
8. Run the SQL checks again.
9. Later, test the full cascade with a real/new slate after the incremental schedule is confirmed clean.

Expected clean state after selected incremental test
- active_queue_rows = 0
- GLOBAL lock_flag = 0
- GLOBAL status = IDLE or completed/reconciled idle state
- no run_requested/running/blocked job flags
- active_incremental_temp_rows = 0
- active enqueue locks = 0

Files
- worker.js
- control_room.html
- main.py
- package.json
- scrape.yml
- wrangler.jsonc
- README_v1.5.10.15.txt
- BUILD_VERSION_AUDIT_v1.5.10.15.txt
