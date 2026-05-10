AlphaDog / OXYGEN-COBALT
v1.5.04.1 - Strict Audit-Only PrizePicks Gate

Purpose:
- Surgical hotfix to the v1.5.04 audit gate.
- PrizePicks Board certification is now audit-only and dispatch-bound.
- The Worker dispatches GitHub with a dispatch_id and only completes the stage from the matching mlb_stats_refresh_audit.run_id row.
- Existing/current mlb_stats rows and generic updated_at freshness cannot certify PrizePicks Board.
- GitHub scraper writes completed/failed audit status with script_version.
- Existing audit tables are additively migrated for script_version/created_at/updated_at when needed.
- Waiting remains locked until matching audit success/failure or the 10-check hard timeout.

Files:
- worker.js
- control_room.html
- main.py
- scrape.yml
- package.json
- wrangler.jsonc
- README_v1.5.04.1.txt
- BUILD_VERSION_AUDIT_v1.5.04.1.txt

Deploy note:
Deploy all files. Do not deploy only worker.js/control_room.html. The GitHub scraper files are required for the matching audit completion signal.

Test sequence:
1. Deploy all files, including scrape.yml and main.py.
2. Run DEBUG > Health and confirm v1.5.04.1 - Strict Audit-Only PrizePicks Gate.
3. Run MANUAL SQL checks for active queue/locks if needed.
4. Run DATA REFRESHING > PrizePicks Board Only.
5. Wait 4-6 minutes without clicking another board run.
6. Run DATA REFRESHING > Orchestrator Status.

Expected:
- If GitHub scraper completes for the matching dispatch_id: prizepicks_board status becomes completed with board_refresh_certified_by_audit.
- If GitHub scraper fails for the matching dispatch_id: prizepicks_board fails with github_scraper_failed_after_dispatch and audit error_message.
- If GitHub never publishes a matching audit result: timeout after 10 checks with PRIZEPICKS_BOARD_REFRESH_TIMEOUT.
