ALPHADOG PHASE 3 FIX - FLAT PACKAGE

WHAT THIS FIXES
1. D1 error: table games has no column named source
2. Makes worker match the current D1 schema exactly
3. Adds Gemini scrape fallback: flash -> pro only on 503/high demand
4. Keeps flat-root files only

UPLOAD
Upload every file in this ZIP to the GitHub repo root.
Do not create folders.
Replace worker.js.
Replace prompt txt files only if GitHub asks.

DEPLOY
Cloudflare dashboard or terminal:
npx wrangler deploy

HTTPBOT SETUP
Method: POST
URL: https://prop-ingestion-git.rodolfoaamattos.workers.dev/tasks/run
Headers:
Content-Type: application/json
x-ingest-token: YOUR_CLOUDFLARE_INGEST_TOKEN
Auth: No Auth
Body Type: Raw

TEST 1 BODY
{"job":"scrape_games_markets"}

RUN COUNT
Run once after this fix.
If success, run two more times for consistency.

SEND BACK
1. First response after deploy
2. Latest 5 task_runs
3. Counts for games and markets_current
