AlphaDog Scheduled Backend
Version: v1.5.05.2 - Clean True Delta Repair Gate

Purpose:
- Hard-block accidental daily all-player/full incremental rebuilds.
- Clean incremental temp tables before every new daily incremental request.
- Use the live base max game date as the strict selector boundary.
- Stage only finalized MLB games after the live max game date into player_game_logs_temp.
- Certify temp A/A+ before promotion.
- Promote by INSERT OR REPLACE only.
- Clean temp, rebuild incremental_player_metrics from live player_game_logs, then certify live tables.

What this fixes:
- The cancelled 778-player temp rebuild path is no longer allowed as a default daily incremental fallback.
- The May 6 live base can now advance by true delta only: May 7+ finalized games.
- Live certification accepts the current real base coverage threshold of 700+ metrics and recognizes role aliases BAT/P as well as BATTER/PITCHER.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Confirm version: v1.5.05.2 - Clean True Delta Repair Gate.
4. In DATA REFRESHING, run Orchestrator Status and confirm no GLOBAL lock is stuck.
5. Run the Incremental Daily Delta job only.
6. After minute cron advances, check incremental_temp_refresh_runs: current_step should start as stage_delta_logs, not stage_logs.
7. Confirm player_game_logs_temp only contains dates after the live max game date unless delta_overlap_days is explicitly supplied.
8. Confirm promotion updates player_game_logs newest game_date beyond 2026-05-06 and incremental_player_metrics newest last_game_date follows it.
