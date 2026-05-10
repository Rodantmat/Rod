AlphaDog / OXYGEN-COBALT
v1.5.04 - PrizePicks Audit Completion Gate

Purpose:
- Fix PrizePicks Board certification source.
- Orchestrator no longer depends only on mlb_stats updated_at guessing.
- GitHub scraper writes mlb_stats_refresh_audit; worker certifies completion from a completed audit row after dispatch.
- If the scraper runs and fails, worker returns the real audit error instead of generic timeout.
- If no completed/failed audit row appears, the locked wait gate still hard-fails after 10 checks.

Files:
- worker.js
- control_room.html
- main.py
- scrape.yml
- package.json
- wrangler.jsonc

Test sequence:
1. Deploy all files, including scrape.yml and main.py.
2. Run DEBUG > Health and confirm v1.5.04 - PrizePicks Audit Completion Gate.
3. Run DATA REFRESHING > PrizePicks Board Only.
4. Wait 4-6 minutes.
5. Run DATA REFRESHING > Orchestrator Status.

Expected:
- If GitHub scraper completes: prizepicks_board status becomes completed with board_refresh_certified_by_audit.
- If GitHub scraper fails: prizepicks_board fails with github_scraper_failed_after_dispatch and audit error_message.
- If GitHub never publishes an audit result: timeout after 10 checks.
