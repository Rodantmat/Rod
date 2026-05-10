AlphaDog / OXYGEN-COBALT
v1.5.04.2 - Real-Time Audit Wait Gate

MAIN PRODUCTION ONLY. Do not use for expansion, POTD, or Main UI work.

Fix scope:
- Keeps PrizePicks Board certification audit-only.
- Does not certify from mlb_stats updated_at or generic board freshness.
- Uses matching mlb_stats_refresh_audit.run_id first.
- Adds safe post-dispatch audit-row fallback only when GitHub/main.py does not echo dispatch_id but writes a real completed audit row after the request.
- Fixes premature timeout caused by duplicate cron/status ticks: timeout now requires the real-time wait window, not tick count alone.
- Adds dispatch ID environment aliases for scraper compatibility.

Deploy all files:
worker.js
control_room.html
main.py
scrape.yml
wrangler.jsonc
package.json

Test:
DEBUG > Health: confirm v1.5.04.2 - Real-Time Audit Wait Gate.
DATA REFRESHING > PrizePicks Board Only.
Wait 11-12 minutes if it stays waiting.
DATA REFRESHING > Orchestrator Status.
Pass: board_refresh_certified_by_audit or board_refresh_certified_by_post_dispatch_audit.
Useful fail: github_scraper_failed_after_dispatch.
Timeout: PRIZEPICKS_BOARD_REFRESH_TIMEOUT only after real-time wait window.
