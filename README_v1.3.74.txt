AlphaDog / OXYGEN-COBALT
v1.3.74 - Global Refresh Orchestrator

SCOPE
- Scheduled backend/control room only.
- Adds database-backed Data Refreshing orchestrator.
- Fixes incremental daily refresh continuation by routing the minute cron through the orchestrator first.
- Keeps existing incremental temp staging/audit/promote/clean/derived flow.
- Does not change scoring math, calibration, Gemini logic, D1 scoring schema, or Main UI.

NEW DATABASE TABLES AUTO-CREATED BY WORKER
- data_refresh_catalog
- data_refresh_queue
- data_refresh_events

NEW CONTROL ROOM GROUP
DATA REFRESHING • ORCHESTRATOR
- Schedule Selected Only
- Cascade From First Checked
- Orchestrator Status
- Run Queue Tick
- Init Tables
- Cancel Active Queue

CATALOG SEQUENCE
01 incremental_daily -> run_incremental_temp_refresh_auto
02 everyday_phase1 -> everyday_phase1_all_direct
03 weather_roof -> scrape_phase2_weather_context
04 lineup_context -> scrape_phase2_lineup_context
05 prizepicks_board -> trigger_prizepicks_github_board_refresh
06 prizepicks_context -> scrape_phase2c_market_context
07 sleeper_board -> run_sleeper_rbi_rfi_market_board
08 sleeper_morning_window -> run_sleeper_rbi_rfi_window_morning
09 odds_api_morning -> run_odds_api_morning
10 scoring_refresh -> run_full_scoring_refresh_v1

HOW IT WORKS
- Schedule Selected Only writes selected jobs to data_refresh_queue.
- Cascade From First Checked writes all jobs from the first checked sequence onward.
- The minute cron checks the queue and advances one safe unit at a time.
- No manual repeated ticking should be required.
- The orchestrator prevents overlapping refresh pipelines by refusing new queues while another queue is pending/running.

INCREMENTAL FIX
- If the queued job is incremental_daily and no incremental temp request exists, the orchestrator schedules one.
- It forces active incremental temp requests due and calls run_incremental_temp_refresh_auto.
- The active request remains running until stage_logs, stage_splits, audit, promote, clean, and derived are complete.

TEST SEQUENCE
1. Deploy v1.3.74.
2. Run DEBUG > Health and confirm v1.3.74.
3. Run DATA REFRESHING > Init Tables.
4. Leave only 01 Incremental Daily checked.
5. Click Schedule Selected Only.
6. Wait 2-3 minutes.
7. Click Orchestrator Status.
8. Click CHECK TEMP > All Incremental Temp.
9. Repeat checks every few minutes. Do not manually tick unless Orchestrator Status shows idle/stuck.
10. Final pass requires incremental_temp_refresh_runs status completed, current_step completed, temp tables cleaned to 0, live player_game_logs latest game_date advanced, and incremental_player_metrics rebuilt.

ZERO-DRIFT NOTE
This build intentionally does not touch scoring math, candidate board scoring, Sleeper/Odds API scoring, RBI Gemini signal logic, or Main UI board rendering.
