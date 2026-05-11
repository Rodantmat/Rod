AlphaDog/OXYGEN-COBALT scheduled backend
v1.5.06.0 - PrizePicks Dispatch Authority Gate

Surgical purpose:
- Preserve the v1.5.05.x single-lane orchestrator, dynamic timeout logic, no-delta incremental success gate, and PrizePicks progress ledger.
- Fix PrizePicks board dispatch ownership so each new queue request dispatches its own GitHub repository_dispatch instead of accidentally inheriting stale prior request state.
- Remove GitHub scheduled cron from scrape.yml. GitHub now runs only when AlphaDog Worker/orchestrator manually triggers repository_dispatch or workflow_dispatch.
- Keep main.py writing progress to prizepicks_scraper_runs and final audit to mlb_stats_refresh_audit.

Deployment files:
- worker.js -> Cloudflare Worker production scheduled backend.
- control_room.html -> Control Room UI.
- scrape.yml -> GitHub .github/workflows/scrape.yml.
- main.py -> GitHub scraper script.
- wrangler.jsonc/package.json unchanged.

Critical flow:
Worker prizepicks_board queue row -> repository_dispatch alphadog_prizepicks_board -> GitHub scrape.yml -> main.py -> prizepicks_scraper_runs + mlb_stats_refresh_audit -> Worker minute cron certifies -> downstream context/scoring can continue.
