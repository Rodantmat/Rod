AlphaDog Bullpen Schema Fix

Root cause:
- bullpens_current currently has PRIMARY KEY(game_id).
- Bullpen data needs two rows per game: one for away team and one for home team.
- That requires PRIMARY KEY(game_id, team_id).

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Then run the included D1 migration once:
- d1_migration_bullpens_current_composite_pk.sql

Cloudflare D1 command:
wrangler d1 execute <YOUR_DB_NAME> --remote --file=d1_migration_bullpens_current_composite_pk.sql

After migration, test:
CLEAN > Full
SCRAPE > FULL RUN
CHECK > Bullpen
CHECK > Bullpen List
CHECK > Truth Audit
CHECK > Scheduler Log
