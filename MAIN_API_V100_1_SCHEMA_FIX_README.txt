ALPHADOG MAIN API v100.1 - SCHEMA COLUMN ALIGNMENT

Purpose:
- Fixes packet/score crash: games table uses away_team/home_team, not away_team_id/home_team_id.
- Keeps the isolated main API worker read-only.
- Does not touch prop-ingestion-git.
- Does not add cron, scheduled handler, scraping, task runner, manual SQL, or D1 writes.

Deploy:
npx wrangler deploy -c alphadog-main-api-v100-wrangler.jsonc

Test:
1) /main/debug/routes
2) /main/health?slate_date=2026-04-25
3) Main page with one Hits leg.
