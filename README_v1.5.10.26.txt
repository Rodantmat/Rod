AlphaDog / OXYGEN-COBALT
Version: v1.5.10.26 - Incremental Fetch Timeout Fuse Gate

Purpose:
- Preserve v1.5.10.24 hitter metrics coverage fix and v1.5.10.25 continuation release intent.
- Add a hard timeout fuse to incremental delta MLB StatsAPI fetches so stage_delta_logs cannot strand the orchestrator request with null output.
- Reduce delta boxscore staging to one finalized game per tick under the incremental orchestrator path.

Changed files:
- worker.js
- control_room.html
- main.py
- README_v1.5.10.26.txt
- BUILD_VERSION_AUDIT_v1.5.10.26.txt

Safety:
- No secrets changed.
- No bindings changed.
- No Cloudflare cron/deployment config changed.
- No Main UI, Expansion worker, or POTD work touched.
- Production data tables are not wiped by this build.

Test summary:
1. Deploy.
2. Use DATA REFRESHING > Killer Cleaner once to clear the currently stuck incremental parent/global lock.
3. Schedule 01 Incremental Daily Delta.
4. Run DATA REFRESHING > Run One Queue Tick.
5. Verify global lock releases between partial ticks and incremental queue rows do not remain RUNNING with null output.
