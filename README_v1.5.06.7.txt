AlphaDog/OXYGEN-COBALT Scheduled Backend
v1.5.06.7 - Unified Resource Address Resolver

Purpose:
- Fix Odds API scheduled/full-run failure where 07 Odds API Morning and 08 Odds API Intraday reported Missing ODDS_API_KEY even when the key exists in the Worker environment.
- Preserve v1.5.06.4/v1.5.06.5 scheduling behavior: full intraday cascades exclude Static Weekly and Incremental Daily, but include both Odds API Morning and Odds API Intraday.
- Keep functions self-contained: each queued function hydrates its own required resource capsule at execution time.

Main changes:
1. Added async Odds API function-capsule resolver.
   - Checks direct env aliases.
   - Checks nested values.
   - Checks job-local function_capsule/resources/secrets inputs.
   - Checks Cloudflare Secret Store / KV-style bindings with get/read/getSecret/secret methods.
   - Reports checked sources without exposing key values.

2. runOddsApiMarketIntel now uses getOddsApiKeyCapsule(env, input).
   - Helpers receive the resolved capsule key.
   - Missing key output now includes function_capsule diagnostics.
   - Missing key remains recoverable and does not trap the queue.

3. Schedule plans remain locked:
   - Weekly Static Reference Refresh: Monday 12:30 AM PT, selected static_weekly only.
   - Daily Incremental Delta: daily 1:30 AM PT, selected incremental_daily only.
   - Intraday Refresh 9:00 AM / 1:00 PM / 10:00 PM PT: cascade only everyday_phase1, weather_roof, lineup_context, prizepicks_board, prizepicks_context, odds_api_morning, odds_api_afternoon, scoring_refresh.
   - Static Weekly and Incremental Daily are intentionally excluded from full intraday cascades.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Go to DATA REFRESHING.
4. Click Cancel Queue.
5. Click Init Production Clock.
6. Click Production Clock Status and confirm active_queue is empty and the three intraday plans list both odds_api_morning and odds_api_afternoon.
7. Click Schedule Cascade.
8. Wait roughly 15-20 minutes.
9. Run Manual SQL with the chain_id returned by Schedule Cascade:

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
- everyday_phase1 completed
- weather_roof completed
- lineup_context completed/pass_with_warnings allowed
- prizepicks_board completed
- prizepicks_context completed
- odds_api_morning should no longer fail with Missing ODDS_API_KEY if the key exists in any supported capsule/env/secret-store path
- odds_api_afternoon should no longer fail with Missing ODDS_API_KEY if the key exists in any supported capsule/env/secret-store path
- scoring_refresh should run after odds stages, even if an optional Odds API source returns a recoverable external/config issue
