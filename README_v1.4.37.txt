AlphaDog v1.4.37 - Strict PrizePicks Refresh Gate

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- main.py
- scrape.yml

Surgical changes:
- PrizePicks Board no longer soft-passes from existing current board rows.
- PrizePicks Board requires GitHub dispatch config and a confirmed mlb_stats update after requested_at.
- If GitHub dispatch config is missing, prizepicks_board hard-fails and blocks downstream work.
- main.py uses mlb_stats_temp, certifies it, replaces mlb_stats only after certification, then clears temp.
- main.py exits non-zero on connection, certification, D1, or sync failure so GitHub Actions cannot hide board-refresh failures.
- scrape.yml remains the board-only GitHub workflow, with the same schedule/manual dispatch behavior.

Test sequence:
1. Deploy worker/control room.
2. Replace GitHub main.py and scrape.yml with these files.
3. Open Control Room.
4. Click DEBUG > Health.
5. Confirm v1.4.37 - Strict PrizePicks Refresh Gate.
6. Click DATA REFRESHING > Run PrizePicks Board Only.
7. Check the queue row: it must dispatch/wait, then complete only after mlb_stats updates after requested_at.
8. Confirm mlb_stats has future rows, no stale rows, no duplicate line_id, and mlb_stats_temp has 0 rows after success.


HOTFIX CHECK: wrangler.jsonc name is alphadog-phase3-starter-groups. Do not deploy to prop-ingestion-git.
