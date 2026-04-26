OXYGEN-COBALT Main-1F New API Worker Lock

Purpose:
- Main page/frontend points to the isolated main API worker.
- Main API worker is separate from the scheduled backend worker.
- Scheduled backend worker prop-ingestion-git remains untouched.

Protected scheduled worker:
- prop-ingestion-git
- Do not overwrite.
- Do not deploy this package using prop-ingestion-git config.

Main API worker:
- alphadog-main-api-v100
- Worker file: alphadog-main-api-v100-worker.js
- Config file: alphadog-main-api-v100-wrangler.jsonc
- Deploy command:
  npx wrangler deploy -c alphadog-main-api-v100-wrangler.jsonc

Main page files:
- index.html
- alphadog-main-styles.css
- alphadog-main-parser.js
- alphadog-main-connectors.js
- alphadog-main-ui-engine.js
- alphadog-main-core.js

Default frontend API target:
- https://alphadog-main-api-v100.rodolfoaamattos.workers.dev

Expected API tests after worker deploy:
1. https://alphadog-main-api-v100.rodolfoaamattos.workers.dev/main/debug/routes
2. https://alphadog-main-api-v100.rodolfoaamattos.workers.dev/main/health?slate_date=2026-04-25

Important:
- No cron in this package.
- No scheduled handler in the main API worker.
- No task runner.
- No candidate builders.
- No scraping.
- No manual SQL.
- Main API worker is intended as read-only D1 packet/score adapter for the frontend.
