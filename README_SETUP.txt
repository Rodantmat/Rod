PROP ENGINE WORKER — FLAT ROOT SETUP

FILES:
- worker.js
- wrangler.jsonc
- package.json
- score_ks_v1.txt
- score_hits_v1.txt
- score_default_v1.txt

GITHUB SETUP:
1. Create a GitHub repo.
2. Upload all files in the root of the repo. Do not put them in folders.
3. Your prompt base URL will be:
   https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main

CLOUDFLARE SETUP:
1. Connect this repo to Cloudflare Workers, or deploy manually from laptop.
2. In Cloudflare Worker settings, add D1 binding:
   Binding name: DB
   Database: prop-engine-db
3. Add secrets:
   INGEST_TOKEN
   GEMINI_API_KEY
4. Add variable:
   PROMPT_BASE_URL = https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main

IMPORTANT:
- Prompt files are now editable in GitHub.
- Worker code should not need frequent editing.
- Every scoring prompt must include {{PACKET_JSON}} exactly.

TEST ORDER:
1. GET /health
2. POST /packet/leg
3. POST /score/leg

ROUTES:
GET  /health
POST /ingest/run-slate
POST /ingest/games
POST /ingest/slate
POST /ingest/players
POST /ingest/markets
POST /ingest/upsert
POST /packet/leg
POST /score/leg
