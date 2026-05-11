AlphaDog/OXYGEN-COBALT scheduled backend
v1.5.06.1 - PrizePicks Secret Resolver Alignment Gate

Surgical purpose:
- Preserve v1.5.06.0 orchestrator flow, single-lane queue, no-delta incremental success gate, dynamic timeout logic, and PrizePicks progress ledger.
- Fix the production config/name mismatch by setting wrangler.jsonc name to prop-ingestion-git.
- Add keep_vars:true so Cloudflare dashboard secrets/variables are preserved during deploy.
- Fix GitHub dispatch resolver to support the actual split secret pattern: GITHUB_OWNER + GITHUB_REPO.
- Keep repository_dispatch as the AlphaDog-controlled trigger. No GitHub schedule cron.
- Pass worker URL through CONTROL_WORKER_URL/ALPHADOG_WORKER_URL fallback so main.py can write progress to prizepicks_scraper_runs.

Deployment files:
- worker.js -> Cloudflare Worker production scheduled backend.
- control_room.html -> Control Room UI.
- scrape.yml -> GitHub .github/workflows/scrape.yml.
- main.py -> GitHub scraper script.
- wrangler.jsonc -> prop-ingestion-git with keep_vars true.

Critical flow:
Worker prizepicks_board queue row -> repository_dispatch alphadog_prizepicks_board -> GitHub scrape.yml -> main.py -> prizepicks_scraper_runs + mlb_stats_refresh_audit -> Worker minute cron certifies -> downstream context/scoring can continue.
