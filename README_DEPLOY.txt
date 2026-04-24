ALPHADOG PHASE 3 PACKAGE

FILES INCLUDED:
- worker.js
- scrape_daily_mlb_slate_v1.txt
- scrape_teams_v1.txt
- scrape_starters_v1.txt
- scrape_lineups_v1.txt
- scrape_bullpens_v1.txt
- scrape_players_v1.txt
- scrape_recent_usage_v1.txt
- score_default_v1.txt
- score_ks_v1.txt
- score_hits_v1.txt
- schema_patch.sql

UPLOAD TO GITHUB:
1. Open repo: Rodantmat/Rod
2. Replace worker.js with this worker.js
3. Upload all .txt prompt files to the repo root
4. Commit changes to main

DEPLOY TO CLOUDFLARE:
1. Open Cloudflare Worker: prop-ingestion-git
2. Confirm GitHub deploy finished, OR run:
   npx wrangler deploy

FIRST TEST:
POST /health
Expected: ok true, worker alphadog-phase3-split

RUN GAMES + MARKETS:
POST /tasks/run
Body:
{
  "job": "scrape_games_markets"
}

RUN TEAMS:
POST /tasks/run
Body:
{
  "job": "scrape_teams"
}

RUN STARTERS:
POST /tasks/run
Body:
{
  "job": "scrape_starters"
}

CHECK TASKS:
SELECT * FROM task_runs ORDER BY started_at DESC LIMIT 5;

CHECK COUNTS:
SELECT COUNT(*) FROM games;
SELECT COUNT(*) FROM markets_current;
SELECT COUNT(*) FROM teams_current;
SELECT COUNT(*) FROM starters_current;

BRING BACK:
- /health response
- each /tasks/run response
- latest 5 task_runs rows
- row counts

IMPORTANT:
- Do not run lineups/bullpens/players/recent_usage until games, markets, teams, and starters are confirmed stable.
- If a task fails, do not patch manually. Bring the full error back.
