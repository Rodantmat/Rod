AlphaDog Main UI v1.0.02 - Independent Main UI Filter Fix

Flat-root Cloudflare Worker build.

Important:
- main_alphadog_wrangler.jsonc intentionally has NO assets block.
- Worker serves / and /index.html directly from main_alphadog_worker.js.
- This prevents Cloudflare from scanning root/node_modules as Workers Assets.
- D1 binding remains DB.
- This worker is independent from the control room/scheduler worker.

Fixes:
- Final score filter is client-side and changes immediately after refresh.
- Loads all active_score_board rows up to 2000, not just top 10 candidate rows.
- Falls back to odds_api_player_props for game time when PrizePicks exact match is unavailable.
- Replaces raw no-vig/market-confidence card text with friendlier, data-grounded comments.
