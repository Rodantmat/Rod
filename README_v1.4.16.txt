AlphaDog / OXYGEN-COBALT
v1.4.16 - Production Watchdog Purge Guard

Surgical production scheduled-backend/control-room build.

Scope:
- Production scheduled backend only.
- Worker target locked to alphadog-phase3-starter-groups.
- No expansion worker changes.
- No xp_* mutations.
- No scoring math changes.
- HITS, TOTAL_BASES, and RBI scoring formulas preserved from v1.4.15.

Changes:
- Adds health boolean flags for ODDS_API_KEY, GitHub repo/token/workflow, Gemini, ingest token, scheduled handler, and production clock.
- Adds DATA REFRESHING > Watchdog Purge Guard manual button/job.
- Runs Watchdog Purge Guard automatically from the minute cron before schedule enqueue and queue tick.
- Watchdog releases scoring_refresh rows stuck behind optional Odds API failure.
- Watchdog finalizes stale pending NULL-run_after rows after a safe threshold instead of letting them block future schedules forever.
- Watchdog finalizes stale running queue rows after a safe threshold.
- Odds API morning/afternoon failures are treated as optional enrichment failures inside the orchestrator, so they continue to scoring_refresh with degraded/odds_missing context instead of blocking the board.
- Production schedule due logic now catches up missed same-day PT slots instead of requiring the exact minute only.
- AUTO slate resolver now rolls to next pickable slate after 9 PM Pacific, while downstream board/game start-time freshness still controls actual pickability.
- Adds scheduled minute heartbeat event logging through data_refresh_events.
- Updates Control Room base URL and wrangler target to alphadog-phase3-starter-groups.

Production clock schedule:
- Weekly Static Reference Refresh: Monday 12:30 AM Pacific.
- Daily Incremental Delta: daily 1:30 AM Pacific.
- Intraday Full Refresh: daily 9:00 AM Pacific.
- Intraday Full Refresh: daily 1:00 PM Pacific.
- Late Rollover Refresh: daily 10:00 PM Pacific, with AUTO slate resolving to next pickable slate after 9 PM Pacific.

Deploy:
npm install && npx wrangler deploy --config wrangler.jsonc

Test sequence:
1. DEBUG > Health
   - Confirm version v1.4.16.
   - Confirm worker alphadog-phase3-starter-groups.
   - Confirm odds_api_key_bound true.
   - Confirm github_repo_bound and github_token_bound true.

2. DATA REFRESHING > Init Production Clock
   - Confirms schedule table exists and seeded.

3. DATA REFRESHING > Production Clock Status
   - Confirm weekly static Monday 12:30 AM PT.
   - Confirm daily incremental 1:30 AM PT.
   - Confirm 9:00 AM, 1:00 PM, and 10:00 PM PT intraday plans.

4. DATA REFRESHING > Watchdog Purge Guard
   - Confirm stale queue action if a stuck row exists.
   - Confirm it does not mutate scoring math or xp_* tables.

5. DATA REFRESHING > Run One Queue Tick
   - Let queue advance one backend-safe unit.

6. DATA REFRESHING > Orchestrator Status
   - Confirm no pending NULL-run_after blocker remains unless it is a valid future cascade row waiting behind a running job.

7. If candidate board was stale, run:
   SCORING V1 > Check MLB Scores
   Then refresh Main UI.

Focused SQL after deploy:
SELECT request_id, chain_id, job_key, status, run_after, started_at, finished_at, error, updated_at
FROM data_refresh_queue
WHERE status IN ('pending','running','retry_later')
ORDER BY created_at ASC
LIMIT 50;

SELECT plan_key, enabled, hour_pt, minute_pt, last_enqueued_key, last_enqueued_at
FROM data_refresh_schedule_plan
ORDER BY hour_pt, minute_pt;

SELECT created_at, chain_id, job_key, event_type, status, message
FROM data_refresh_events
WHERE event_type LIKE 'watchdog%' OR event_type='scheduled_heartbeat'
ORDER BY created_at DESC
LIMIT 50;
