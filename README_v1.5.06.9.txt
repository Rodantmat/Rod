AlphaDog/OXYGEN-COBALT
v1.5.06.9 - Capsule Parity Recovery Lock

Purpose:
Stop the scheduled/cascade path from losing resources that already work in one-by-one job execution.

What changed:
- Added a recovery-grade shared resource resolver for GitHub and Odds API jobs.
- The resolver now checks exact bindings, normalized aliases, object/nested secret shapes, KV/Secret-style bindings, DB resource/config tables, inline config text, remote config.txt, and fuzzy production binding names.
- Fuzzy matching is purpose-gated so GitHub token lookup will not accidentally read repo/workflow/ref variables, and Odds lookup will not accidentally read URLs/regions/markets.
- PrizePicks Board dispatch now has a 12-second fetch safety timeout so a bad GitHub dispatch call cannot leave the board row running with null output forever.
- Full intraday cascades remain exactly 8 jobs: everyday_phase1, weather_roof, lineup_context, prizepicks_board, prizepicks_context, odds_api_morning, odds_api_afternoon, scoring_refresh.
- Static weekly and incremental daily remain separate scheduled jobs and are intentionally excluded from full intraday cascades.

Schedules preserved:
- Weekly Static Reference Refresh: Monday 12:30 AM PT, selected static_weekly only.
- Daily Incremental Delta: Daily 1:30 AM PT, selected incremental_daily only.
- Intraday full cascades: 9:00 AM PT, 1:00 PM PT, 10:00 PM PT, selected 8-job cascade only.

Validation before packaging:
- node --check worker.js: PASS.
- Version labels aligned across worker.js, control_room.html, main.py, README, and build audit.
- Cascade list preserved: 8 jobs, excludes static_weekly and incremental_daily, includes both odds windows.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. DATA REFRESHING > Cancel Queue.
4. DEBUG > Health.
5. Confirm Health shows github_token_bound true and odds_api_key_bound true.
6. DATA REFRESHING > Init Production Clock.
7. DATA REFRESHING > Production Clock Status.
8. Confirm active_queue is empty and plans show:
   - Static Monday 12:30 AM PT selected static_weekly only.
   - Daily 1:30 AM PT selected incremental_daily only.
   - Intraday full runs include the 8-job list above.
9. DATA REFRESHING > Schedule Cascade.
10. Wait about 20 minutes.
11. Run Manual SQL for the returned chain_id:

SELECT
  request_id,
  chain_id,
  job_key,
  display_name,
  sequence_order,
  status,
  requested_slate_date,
  tick_count,
  started_at,
  finished_at,
  updated_at,
  error,
  substr(output_json,1,1600) AS output_preview
FROM data_refresh_queue
WHERE chain_id = 'PASTE_CHAIN_ID_HERE'
ORDER BY sequence_order;

Expected:
- PrizePicks Board should dispatch or wait for audit; it should not fail missing_github_dispatch_secret if Health sees the same token.
- Odds Morning/Intraday should not fail Missing ODDS_API_KEY if Health sees the same key.
- Scoring should run after required board/context jobs complete.
