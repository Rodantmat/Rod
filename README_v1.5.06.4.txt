AlphaDog/OXYGEN-COBALT
v1.5.06.4 - Schedule Cascade Scope Gate

Purpose
- Fixes the Production Clock cascade enqueue bug.
- Scheduled full-run cascades now enqueue only the exact job list stored in data_refresh_schedule_plan.selected_job_keys_json.
- Intraday full runs no longer accidentally expand from the first selected job into every later enabled catalog job.
- Static Weekly and Incremental Daily stay on their own dedicated schedules only.
- Full intraday runs now include both Odds API Morning and Odds API Intraday for now, per request.

Intraday full-run job list after this build
- 02 Everyday Phase 1
- 03 Weather/Roof
- 04 Lineup/Scratch
- 05 PrizePicks Board
- 06 PrizePicks Context
- 07 Odds API Morning
- 08 Odds API Intraday
- 09 Scoring Board

Not included in intraday full runs
- 00 Static Weekly
- 01 Incremental Daily Delta

Other fix
- DATA REFRESHING > Cancel Active Queue now cancels pending/running queue rows, resets orchestrator job flags, releases active enqueue locks, and releases the global single-lane state.

Deployment/test sequence
1. Deploy this ZIP.
2. Open Control Room.
3. Go to DATA REFRESHING.
4. Click Init Clock.
5. Click Cancel Active Queue.
6. Click Production Clock Status.
7. Confirm the 9 AM, 1 PM, and 10 PM intraday plans each list exactly the 8 full-run jobs above.
8. For manual full-run test: in DATA REFRESHING, check 02 Everyday Phase 1, 03 Weather/Roof, 04 Lineup/Scratch, 05 PrizePicks Board, 06 PrizePicks Context, 07 Odds API Morning, 08 Odds API Intraday, and 09 Scoring Board.
9. Click Cascade From First Checked.
10. Click Orchestrator Status and then Run Queue Tick as needed to monitor/advance.

Expected result
- The full-run chain has 8 rows.
- It does not include static_weekly.
- It does not include incremental_daily.
- It includes both odds_api_morning and odds_api_afternoon.
