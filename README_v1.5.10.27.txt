AlphaDog / OXYGEN-COBALT
Version: v1.5.10.27 - Incremental Child Cleaner Gate

Purpose:
- Preserve v1.5.10.24 hitter metrics source-of-truth fix.
- Preserve the existing incremental fetch timeout fuse direction.
- Fix the newly proven runtime trap where Killer Cleaner cancelled parent queue rows but left the active incremental_temp_refresh_runs child alive.

Root cause addressed:
- Active parent queue rows were cancelled/reset, but child request e6116ffb... remained pending/running in incremental_temp_refresh_runs.
- New incremental_daily parents rebound to that stale child, then looped through stale recovery instead of starting a clean child run.

Change:
- Killer Cleaner now cancels pending/running rows in incremental_temp_refresh_runs as execution state only.
- Real data tables are preserved: player_game_logs, ref_player_splits, incremental_player_metrics, scoring tables, odds tables, PrizePicks data, and release board rows are not wiped.

Expected test sequence:
1. Deploy.
2. Confirm Control Room version.
3. DATA REFRESHING > Killer Cleaner.
4. Verify no active incremental child rows.
5. DATA REFRESHING > Schedule Selected Only > 01 Incremental Daily Delta.
6. DATA REFRESHING > Run One Queue Tick.
7. Verify the new incremental child request is not the old stale e6116ffb request and parent output is non-null or safely pending/released.
