AlphaDog v1.3.53 / Main UI v1.0.05 - UI Board Recovery + Admin Bridge Guard

MAIN UI WORKER ONLY:
- main_alphadog_worker.js
- main_alphadog_wrangler.jsonc
- index.html
- main_alphadog_logo.png
- main_alphadog_favicon.png
- main_alphadog_apple_touch_icon.png
- main_alphadog_package.json
- .assetsignore

Fixes:
- Restores board loading by removing Safari/iOS Intl date formatting from card rendering.
- Adds stronger /main_alphadog_board JSON error reporting.
- Keeps checkboxes/buttons static in HTML so controls render even before data loads.
- Adds clearer admin refresh error if control worker route is missing.
- Reduces stale-looking admin card quality when volatile feeds are old.

Required bindings/secrets on main UI worker:
- D1 binding: DB -> prop-engine-db
- Secret: INGEST_TOKEN
- Optional secret: CONTROL_WORKER_INGEST_TOKEN if different from INGEST_TOKEN
- Optional var: CONTROL_WORKER_URL, default https://prop-ingestion-git.rodolfoaamattos.workers.dev
