ALPHADOG PHASE 3 STORAGE PATCH — FLAT PACKAGE

WHAT THIS FIXES
1. starters_current can now store BOTH teams per game.
2. bullpens_current can now store BOTH teams per game later.
3. scrape_teams_v1.txt now demands real team stats, not shell-only rows.
4. worker.js now upserts starters/bullpens using (game_id, team_id).

DO THIS IN ORDER

STEP 1 — GITHUB
Upload/replace these files in the GitHub repo root:
- worker.js
- scrape_teams_v1.txt
- scrape_starters_v1.txt
- schema_phase3_storage_patch.sql

Keep all files flat in root. No folders.

STEP 2 — CLOUDFLARE D1 SQL PATCH
Open Cloudflare Dashboard → D1 → your AlphaDog database → Console.
Run the full contents of:
- schema_phase3_storage_patch.sql

After it runs, run:
PRAGMA foreign_key_check;

Expected: no rows / no errors.

STEP 3 — DEPLOY WORKER
In GitHub/Cloudflare flow, deploy the Worker.
If running locally/terminal:
npx wrangler deploy

STEP 4 — HEALTH CHECK
HTTPBot:
Method: GET
URL: https://prop-ingestion-git.rodolfoaamattos.workers.dev/health
Headers:
x-ingest-token: YOUR_SECRET

Expected: ok true.

STEP 5 — TEST TEAMS
HTTPBot:
Method: POST
URL: https://prop-ingestion-git.rodolfoaamattos.workers.dev/tasks/run
Headers:
Content-Type: application/json
x-ingest-token: YOUR_SECRET
Body type: Raw
Body:
{"job":"scrape_teams"}

Retry rule:
- If cancelled/503: wait 5-10 seconds, retry max 3.
- If success: stop.

SQL checks:
SELECT COUNT(*) FROM teams_current;
SELECT COUNT(*) FROM teams_current WHERE avg IS NOT NULL OR obp IS NOT NULL OR slg IS NOT NULL OR ops IS NOT NULL OR k_rate IS NOT NULL OR runs_per_game IS NOT NULL;
SELECT * FROM teams_current LIMIT 10;

STEP 6 — TEST STARTERS
HTTPBot body:
{"job":"scrape_starters"}

Retry rule:
- If cancelled/503: wait 5-10 seconds, retry max 3.
- If success: stop.

SQL checks:
SELECT COUNT(*) FROM starters_current WHERE game_id LIKE '2026-04-24_%';
SELECT * FROM starters_current WHERE game_id LIKE '2026-04-24_%' LIMIT 20;

WHAT TO SEND BACK
1. result of schema patch / PRAGMA foreign_key_check
2. scrape_teams response
3. teams SQL checks
4. scrape_starters response
5. starters SQL checks
6. latest task_runs rows if anything fails
