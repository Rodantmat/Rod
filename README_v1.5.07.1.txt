AlphaDog / OXYGEN-COBALT
v1.5.07.1 - Production Clock Catchup Gate

Purpose:
- Fixes the Production Clock schedule detector so scheduled plans are not limited to one exact minute.
- If a due slot is blocked by the single-lane orchestrator, the clock now logs the block and keeps retrying every minute instead of silently missing the slot or marking it as enqueued.
- Keeps the working previous scoring queue finalizer behavior.
- Preserves capsule parity for PrizePicks board, Odds API Morning, Odds API Intraday, and scoring refresh.
- Fixes stale pending NULL run_after recovery so a valid cascade child row is released to run instead of being failed.

Locked schedule behavior:
- Weekly Static Reference Refresh: Monday 12:30 AM PT, selected static_weekly only.
- Daily Incremental Delta: every day 1:30 AM PT, selected incremental_daily only.
- Intraday full cascades: 9:00 AM, 1:00 PM, and 10:00 PM PT.
- Intraday cascades include everyday_phase1, weather_roof, lineup_context, prizepicks_board, prizepicks_context, odds_api_morning, odds_api_afternoon, scoring_refresh.
- Static weekly and incremental daily are intentionally excluded from intraday cascades.

Test sequence:
1. Deploy this flat ZIP.
2. Open Control Room.
3. Run DATA REFRESHING > Production Clock Status.
4. Run DATA REFRESHING > Schedule Cascade for manual full-run validation.
5. Wait until the cascade completes.
6. Run the SQL status query for the new chain_id.
7. For scheduled validation, after a due time window passes, run Production Clock Status and confirm the plan last_enqueued_key updates for today once the lane was able to enqueue.
