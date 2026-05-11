AlphaDog/OXYGEN-COBALT
v1.5.06.8 - One-Source Capsule Parity Gate

Purpose:
Fix the real cascade/full-run resource mismatch by forcing scheduled/cascade jobs and manual one-by-one jobs to hydrate resources through the same job-local capsule resolver.

What changed:
- PrizePicks Board now resolves GitHub workflow dispatch resources inside triggerPrizePicksGithubBoardRefresh through getGithubDispatchConfigForJob.
- Odds Morning and Odds Intraday now resolve Odds API resources inside runOddsApiMarketIntel through getOddsApiKeyForJob.
- The async capsule resolver checks direct env bindings, accepted aliases, inline config text, KV/Secret-style bindings, DB resource tables, and config.txt fallback.
- Schedule Cascade still only enqueues work. It does not own secrets or alter job execution resources.
- Full intraday cascade remains exactly 8 jobs:
  1. everyday_phase1
  2. weather_roof
  3. lineup_context
  4. prizepicks_board
  5. prizepicks_context
  6. odds_api_morning
  7. odds_api_afternoon
  8. scoring_refresh
- Static Weekly and Incremental Daily remain separate scheduled jobs.

Schedules preserved:
- Weekly Static Reference Refresh: Monday 12:30 AM PT, selected static_weekly only.
- Daily Incremental Delta: Daily 1:30 AM PT, selected incremental_daily only.
- Intraday full cascades: 9:00 AM PT, 1:00 PM PT, 10:00 PM PT, selected 8-job cascade only.

Validation before packaging:
- node --check worker.js: PASS.
- Version labels aligned across worker.js, control_room.html, main.py, README, and build audit.
- Cascade list verified to exclude static_weekly and incremental_daily.
- Cascade list verified to include both odds_api_morning and odds_api_afternoon.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. DATA REFRESHING > Cancel Queue.
4. DATA REFRESHING > Init Production Clock.
5. DATA REFRESHING > Production Clock Status.
6. Confirm active_queue is empty and plans show:
   - Static Monday 12:30 AM PT selected static_weekly only.
   - Daily 1:30 AM PT selected incremental_daily only.
   - Intraday full runs include the 8-job list above.
7. DATA REFRESHING > Schedule Cascade.
8. Wait about 20 to 30 minutes.
9. Run Manual SQL for the returned chain_id:

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
- PrizePicks Board should no longer fail from missing_github_dispatch_secret if the same resource is accessible to manual one-by-one runs.
- Odds Morning/Intraday should no longer fail from Missing ODDS_API_KEY if the same resource is accessible to manual one-by-one runs.
- Scoring should run after required board/context jobs complete.
