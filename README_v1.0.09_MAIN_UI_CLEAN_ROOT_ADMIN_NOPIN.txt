AlphaDog Main UI v1.0.09 - Clean Root UI + Admin No PIN

FILES ARE FLAT ROOT ONLY. No folders.

Deploy target:
- Worker: main-alphadog-ui-v100
- Config: main_alphadog_wrangler.jsonc
- Main file: main_alphadog_worker.js

Do not deploy this ZIP over the control/scheduled backend worker.
Control worker should stay on v1.3.50 unless we intentionally rebuild it.

What changed:
- Main UI root route / serves the board directly from the Worker.
- Admin screen opens with no PIN.
- Removed all PIN modal/event code.
- Kept board card loading and filters.
- Kept Admin freshness cards.
- Full Refresh button calls the main UI bridge, which tries the locked v1.3.50 backend /deferred/full-run route.
- Added hard UI error display so JavaScript failures show on screen instead of silently killing buttons.

Required secrets/bindings on main UI worker:
- DB binding named DB, same D1 database.
- INGEST_TOKEN secret matching the control backend token.
- Optional CONTROL_WORKER_INGEST_TOKEN if you want a separate token alias.
- Optional CONTROL_WORKER_URL, but the worker also hard-locks to https://prop-ingestion-git.rodolfoaamattos.workers.dev as fallback.

Test sequence:
1. Deploy this ZIP only to main-alphadog-ui-v100.
2. Open the main UI worker URL root /. Do not test root / on prop-ingestion-git; that is the backend and can show Not found normally.
3. Open /main_alphadog_health on the main UI worker. Expected: ok=true, db_bound=true, ingest_token_bound=true.
4. Open /main_alphadog_board on the main UI worker. Expected: ok=true and rows_count greater than 0.
5. On the UI, click Refresh. Expected: cards reload and filters still work.
6. Click Admin. Expected: admin opens immediately with no PIN.
7. Click Back Board. Expected: returns to cards.
8. Click Admin again, then Refresh Full Data. Expected: confirmation prompt, then either Data Refresh Started or a clear token/backend diagnostic.
