AlphaDog v1.2.58 - Recovery Spine

Surgical recovery build from v1.2.57.

Locked fixes:
1. Control-room buttons remain restored and use real SQL payloads.
2. System event ledger remains active for health, manual SQL, checks, jobs, and scheduled runs.
3. Scheduled run task_rows now use scheduled_full_pipeline_plus_board_queue instead of being mislabeled as only run_full_pipeline.
4. MLB API fetches now use retry-safe JSON wrappers for schedule, pitcher stats, boxscore, previous schedule, and roster calls.
5. MLB Players G1 no longer clears players_current until after roster rows are successfully fetched and validated.
6. MLB Players G1 now returns explicit no_slate_teams or zero_player_rows diagnostics instead of silently wiping/emptying data.
7. MLB Lineups still returns no_confirmed_lineups_yet as a non-crash retry_later state when MLB has not posted batting orders yet.
8. Added CHECK > MLB Data Coverage Today and CHECK > Recent Failures buttons.

Do not change scoring or candidate ranking in this build.
