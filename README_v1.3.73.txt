AlphaDog / OXYGEN-COBALT
v1.3.73 - Incremental Auto Runner No Manual Tick

Purpose:
- Surgical follow-up to v1.3.72.
- Keeps the fresh MLB StatsAPI incremental temp fetch repair.
- Removes the need for repeated manual Run Temp Tick clicks.
- Adds a one-click auto-runner that schedules/continues the daily incremental temp pipeline and lets the minute cron keep advancing it.

What changed:
1. Added executable job: run_incremental_temp_refresh_auto.
2. Added Control Room button: INCREMENTAL TEMP > Start/Continue Auto Refresh.
3. Changed Schedule Daily Temp Test to schedule and immediately auto-start/kick the incremental runner.
4. Changed the old Run One Refresh Tick path to redirect into the auto-runner fallback instead of requiring one manual tick at a time.
5. Changed minute cron incremental handling to run the bounded auto-loop, not just one naked tick.
6. When a stage still needs more players, run_after remains due immediately for the auto-runner/minute cron.

What did NOT change:
- No scoring math changed.
- No RBI logic changed.
- No Hits/TB scoring changed.
- No static refresh logic changed.
- No schema migration required.
- No candidate board logic changed.
- No Main UI files included or touched.

Expected behavior:
- Press INCREMENTAL TEMP > Start/Continue Auto Refresh once, or Schedule + Auto Start once.
- The request starts or continues.
- The minute cron advances the same request until completed.
- User does not manually repeat Run Temp Tick.
- Temp tables fill first, then audit/promote/clean/derived complete.

Test sequence:
1. Deploy this ZIP to the scheduled backend Worker.
2. Open Control Room.
3. Run DEBUG > Health. Confirm version: v1.3.73 - Incremental Auto Runner No Manual Tick.
4. In group INCREMENTAL TEMP, click Start/Continue Auto Refresh once.
5. Wait 3-5 minutes.
6. In group CHECK TEMP, click All Incremental Temp.
7. Confirm latest_temp_refresh status is running or completed and player_game_logs_temp is increasing while stage_logs is active.
8. Do not manually tick repeatedly. Wait for minute cron.
9. When completed, run CHECK > Incremental All and confirm max game date/last_game_date advanced.

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.73.txt
- BUILD_VERSION_AUDIT_v1.3.73.txt
